from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    RegisterView, LogoutView, MeView,
    CourseListCreateView, CourseDetailView, InstructorCourseListView,
    LessonListCreateView, LessonDetailView,
    EnrollView, MyEnrollmentsView,
    MarkLessonCompleteView, CourseProgressView, CourseProgressListView,
    CourseLessonProgressView,
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),

    # Courses  (specific paths MUST come before parameterised ones)
    path('courses/', CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/mine/', InstructorCourseListView.as_view(), name='my-courses'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),

    # Lessons
    path('courses/<int:course_id>/lessons/', LessonListCreateView.as_view(), name='lesson-list-create'),
    path('lessons/<int:pk>/', LessonDetailView.as_view(), name='lesson-detail'),

    # Enrollment
    path('courses/<int:course_id>/enroll/', EnrollView.as_view(), name='enroll'),
    path('enrollments/', MyEnrollmentsView.as_view(), name='my-enrollments'),

    # Progress
    path('lessons/<int:lesson_id>/complete/', MarkLessonCompleteView.as_view(), name='mark-complete'),
    path('courses/<int:course_id>/progress/', CourseProgressView.as_view(), name='course-progress'),
    path('courses/<int:course_id>/lesson-progress/', CourseLessonProgressView.as_view(), name='course-lesson-progress'),
    path('progress/', CourseProgressListView.as_view(), name='all-progress'),
]
