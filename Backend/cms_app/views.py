from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import User, Course, Lesson, Enrollment, LessonProgress
from .serializers import (
    RegisterSerializer, UserSerializer,
    CourseSerializer, CourseDetailSerializer,
    LessonSerializer,
    EnrollmentSerializer,
    LessonProgressSerializer, CourseProgressSerializer,
)
from .permissions import IsInstructor, IsEnrolledOrInstructor


# ── Auth ─────────────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data['refresh']
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# ── Courses ───────────────────────────────────────────────────────────────────────

class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all().order_by('-created_at')
    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsInstructor()]

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

    def get_queryset(self):
        qs = Course.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search', '')
        category = self.request.query_params.get('category', '')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(description__icontains=search))
        if category:
            qs = qs.filter(category=category)
        return qs


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()

    def get_serializer_class(self):
        return CourseDetailSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsInstructor()]

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.instructor != request.user:
                self.permission_denied(request, message='You can only modify your own courses.')


class InstructorCourseListView(generics.ListAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated, IsInstructor]

    def get_queryset(self):
        return Course.objects.filter(instructor=self.request.user).order_by('-created_at')


# ── Lessons ───────────────────────────────────────────────────────────────────────

class LessonListCreateView(generics.ListCreateAPIView):
    serializer_class = LessonSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsInstructor()]

    def get_queryset(self):
        return Lesson.objects.filter(course_id=self.kwargs['course_id'])

    def perform_create(self, serializer):
        course = get_object_or_404(Course, pk=self.kwargs['course_id'])
        if course.instructor != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only add lessons to your own courses.')
        serializer.save(course=course)


class LessonDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = LessonSerializer
    queryset = Lesson.objects.all()

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsInstructor()]

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        if request.method not in permissions.SAFE_METHODS:
            if obj.course.instructor != request.user:
                self.permission_denied(request, message='You can only modify lessons in your own courses.')


# ── Enrollment ────────────────────────────────────────────────────────────────────

class EnrollView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, course_id):
        if request.user.role != 'student':
            return Response({'detail': 'Only students can enroll in courses.'}, status=status.HTTP_403_FORBIDDEN)
        course = get_object_or_404(Course, pk=course_id)
        if Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'detail': 'Already enrolled in this course.'}, status=status.HTTP_400_BAD_REQUEST)
        enrollment = Enrollment.objects.create(student=request.user, course=course)
        return Response(EnrollmentSerializer(enrollment).data, status=status.HTTP_201_CREATED)


class MyEnrollmentsView(generics.ListAPIView):
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Enrollment.objects.filter(student=self.request.user).select_related('course')


# ── Progress ──────────────────────────────────────────────────────────────────────

class MarkLessonCompleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lesson_id):
        lesson = get_object_or_404(Lesson, pk=lesson_id)
        # ensure student is enrolled
        if not Enrollment.objects.filter(student=request.user, course=lesson.course).exists():
            return Response({'detail': 'You are not enrolled in this course.'}, status=status.HTTP_403_FORBIDDEN)
        progress, created = LessonProgress.objects.get_or_create(
            student=request.user, lesson=lesson,
            defaults={'completed': True}
        )
        if not created:
            progress.completed = True
            progress.save()
        return Response({'detail': 'Lesson marked as complete.', 'lesson_id': lesson_id})


class CourseProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if not Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'detail': 'Not enrolled.'}, status=status.HTTP_403_FORBIDDEN)
        total = course.lessons.count()
        completed = LessonProgress.objects.filter(
            student=request.user, lesson__course=course, completed=True
        ).count()
        completed = min(completed, total)
        percentage = round((completed / total * 100), 1) if total > 0 else 0
        return Response({
            'course_id': course_id,
            'total_lessons': total,
            'completed_lessons': completed,
            'progress_percentage': percentage,
        })


class CourseProgressListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        enrollments = Enrollment.objects.filter(student=request.user).select_related('course')
        result = []
        for enrollment in enrollments:
            course = enrollment.course
            total = course.lessons.count()
            completed = LessonProgress.objects.filter(
                student=request.user, lesson__course=course, completed=True
            ).count()
            completed = min(completed, total)
            percentage = round((completed / total * 100), 1) if total > 0 else 0
            result.append({
                'course_id': course.id,
                'course_title': course.title,
                'total_lessons': total,
                'completed_lessons': completed,
                'progress_percentage': percentage,
            })
        return Response(result)


class CourseLessonProgressView(APIView):
    """Return completion status for every lesson in a course for the current user."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, course_id):
        course = get_object_or_404(Course, pk=course_id)
        if not Enrollment.objects.filter(student=request.user, course=course).exists():
            return Response({'detail': 'Not enrolled.'}, status=status.HTTP_403_FORBIDDEN)
        lesson_ids = course.lessons.values_list('id', flat=True)
        completed_ids = set(
            LessonProgress.objects.filter(
                student=request.user, lesson__course=course, completed=True
            ).values_list('lesson_id', flat=True)
        )
        result = [{'lesson_id': lid, 'completed': lid in completed_ids} for lid in lesson_ids]
        return Response(result)
