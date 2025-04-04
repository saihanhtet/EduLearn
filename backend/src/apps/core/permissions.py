from django.http import HttpRequest
from ninja.errors import HttpError


def check_permission(request: HttpRequest, permission: str) -> bool:
    """Check if the user has the specified permission."""
    if not request.user.is_authenticated:
        return False
    return request.user.has_perm(permission)


def is_admin(request: HttpRequest) -> bool:
    """Check if the user is an admin."""
    return request.user.is_authenticated and request.user.role == "admin"


def is_teacher(request: HttpRequest) -> bool:
    """Check if the user is a teacher."""
    return request.user.is_authenticated and request.user.role == "teacher"


def is_student(request: HttpRequest) -> bool:
    """Check if the user is a student."""
    return request.user.is_authenticated and request.user.role == "student"

# Permission checks for specific models


def has_course_permission(request: HttpRequest, method: str, obj=None) -> bool:
    if method == "GET":
        return check_permission(request, "core.can_view_course")
    if method == "POST":
        return check_permission(request, "core.can_create_course")
    if method in ("PUT", "PATCH"):
        return check_permission(request, "core.can_edit_course") and (obj is None or request.user == obj.created_by or is_admin(request))
    if method == "DELETE":
        return check_permission(request, "core.can_delete_course") and (obj is None or request.user == obj.created_by or is_admin(request))
    return False


def has_enrollment_permission(request: HttpRequest, method: str, obj=None) -> bool:
    if method == "GET":
        return check_permission(request, "core.can_view_enrollment")
    if method == "POST":
        return check_permission(request, "core.can_enroll_course")
    if method == "DELETE":
        return check_permission(request, "core.can_delete_enrollment") and (obj is None or request.user == obj.user or is_admin(request))
    return False


def has_interaction_permission(request: HttpRequest, method: str, obj=None) -> bool:
    if method == "GET":
        return check_permission(request, "core.can_view_interaction")
    if method == "POST":
        return check_permission(request, "core.can_log_interaction")
    if method == "DELETE":
        return check_permission(request, "core.can_delete_interaction") and (obj is None or request.user == obj.user or is_admin(request))
    return False


def has_progress_permission(request: HttpRequest, method: str, obj=None) -> bool:
    if method == "GET":
        return check_permission(request, "core.can_view_progress")
    if method in ("PUT", "PATCH"):
        return check_permission(request, "core.can_update_progress") and (obj is None or request.user == obj.user or is_admin(request))
    if method == "DELETE":
        return check_permission(request, "core.can_delete_progress") and (obj is None or request.user == obj.user or is_admin(request))
    return False


def has_user_permission(request: HttpRequest, method: str, obj=None) -> bool:
    if method == "GET":
        return check_permission(request, "users.can_view_users")
    if method in ("PUT", "PATCH"):
        return check_permission(request, "users.can_edit_users") and (obj is None or request.user == obj or is_admin(request))
    if method == "DELETE":
        return check_permission(request, "users.can_delete_users") and is_admin(request)
    return False
