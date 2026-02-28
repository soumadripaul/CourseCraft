from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsInstructor(BasePermission):
    """Allow access only to users with the 'instructor' role."""

    message = 'Only instructors can perform this action.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'instructor')


class IsEnrolledOrInstructor(BasePermission):
    """Allow enrolled students or the course instructor."""

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'instructor':
            return obj.instructor == request.user
        from .models import Enrollment
        return Enrollment.objects.filter(student=request.user, course=obj).exists()
