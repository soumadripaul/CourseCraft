from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Course, Lesson, Enrollment, LessonProgress


# ── Auth ────────────────────────────────────────────────────────────────────────

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'password2', 'role',
                  'first_name', 'last_name')

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('username', 'role', 'date_joined')


# ── Course ───────────────────────────────────────────────────────────────────────

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = ('id', 'course', 'title', 'video_url', 'duration', 'order')
        read_only_fields = ('course',)


class CourseSerializer(serializers.ModelSerializer):
    instructor = UserSerializer(read_only=True)
    lesson_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ('id', 'title', 'description', 'thumbnail', 'instructor',
                  'created_at', 'lesson_count', 'category')
        read_only_fields = ('instructor', 'created_at')

    def get_lesson_count(self, obj):
        return obj.lessons.count()


class CourseDetailSerializer(CourseSerializer):
    lessons = LessonSerializer(many=True, read_only=True)

    class Meta(CourseSerializer.Meta):
        fields = CourseSerializer.Meta.fields + ('lessons',)


# ── Enrollment ───────────────────────────────────────────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    course_id = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(), write_only=True, source='course'
    )

    class Meta:
        model = Enrollment
        fields = ('id', 'course', 'course_id', 'enrolled_at')
        read_only_fields = ('enrolled_at',)


# ── Progress ─────────────────────────────────────────────────────────────────────

class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ('id', 'lesson', 'completed')


class CourseProgressSerializer(serializers.Serializer):
    course_id = serializers.IntegerField()
    total_lessons = serializers.IntegerField()
    completed_lessons = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
