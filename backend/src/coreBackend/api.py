from typing import Optional, Union, List
from datetime import datetime
from ninja_extra import ControllerBase, NinjaExtraAPI, api_controller, http_get, http_post, http_put, http_delete, route
from ninja_jwt.controller import NinjaJWTDefaultController
from django.contrib.auth.models import Permission
from ninja.errors import HttpError

from apps.core.utils.recommendation import recommend_courses
from apps.users.models import CustomUser, Profile
from apps.users.schemas import ProfileSchema, UserDetailSchema, RegisterSchema
from apps.core.permissions import is_admin, has_user_permission
from apps.core.models import Course, Enrollment, UserInteraction, LearningProgress
from apps.core.permissions import (
    is_admin as is_admin_core, is_teacher, is_student, has_course_permission,
    has_enrollment_permission, has_interaction_permission, has_progress_permission
)
from .schemas import (
    DebugJWTAuth, EnrollmentCreateSchema, CourseSchema,
    CourseCreateSchema, CourseCreateSchema, EnrollmentSchema,
    UserInteractionSchema, UserInteractionCreateSchema, LearningProgressSchema,
    LearningProgressUpdateSchema, PersonalizedRecommendationResponse
)

# Create a single NinjaExtraAPI instance
api = NinjaExtraAPI()

# Use DebugJWTAuth for all endpoints
auth = DebugJWTAuth()

# Register the JWT controller for token endpoints (/api/token/pair, /api/token/refresh)
api.register_controllers(NinjaJWTDefaultController)


# Authentication Endpoints (from apps.users.api)


@api_controller("/auth")
class AuthController:
    @http_post("/register", response=UserDetailSchema)
    def register(self, request, data: RegisterSchema):
        if CustomUser.objects.filter(email=data.email).exists():
            raise HttpError(400, "Email already exists")
        if CustomUser.objects.filter(username=data.username).exists():
            raise HttpError(400, "Username already exists")

        user = CustomUser.objects.create_user(
            email=data.email,
            username=data.username,
            password=data.password,
            role=data.role,
        )

        # Assign permissions based on role
        if user.role == "student":
            permissions = [
                "core.can_view_course",
                "core.can_enroll_course",
                "core.can_view_enrollment",
                "core.can_delete_enrollment",
                "core.can_log_interaction",
                "core.can_view_interaction",
                "core.can_delete_interaction",
                "core.can_update_progress",
                "core.can_view_progress",
                "core.can_delete_progress",
                "core.can_view_users",
            ]
        elif user.role == "teacher":
            permissions = [
                "core.can_create_course",
                "core.can_edit_course",
                "core.can_view_course",
                "core.can_view_enrollment",
                "core.can_view_interaction",
                "core.can_view_progress",
                "core.can_view_users",
            ]
        else:  # admin
            permissions = Permission.objects.all()

        for perm in permissions:
            if isinstance(perm, str):
                perm_obj = Permission.objects.get(codename=perm.split(".")[1])
                user.user_permissions.add(perm_obj)
            else:
                user.user_permissions.add(perm)

        return user

    @http_post("/logout", auth=auth)
    def logout(self, request):
        # With JWT, logout is typically handled client-side by removing the token
        return {"message": "Logged out successfully"}

# User Endpoints (from apps.users.api)


def user_to_schema(user: CustomUser) -> UserDetailSchema:
    profile = getattr(user, "profile", None)
    return UserDetailSchema(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        preferred_subject=user.preferred_subject,
        profile=ProfileSchema(
            bio=profile.bio if profile else None,
            website=profile.website if profile else None,
            gender=profile.gender if profile else None,
            date_of_birth=profile.date_of_birth.isoformat(
            ) if profile and profile.date_of_birth else None,
            phone_number=profile.phone_number if profile else None,
            account_status=profile.account_status if profile else "Active",
            joined_date=profile.joined_date.isoformat(
            ) if profile else None,
        )
    )


def course_to_schema(course: Course) -> CourseSchema:
    return CourseSchema(
        id=course.id,
        title=course.title,
        subject=course.subject,
        level=course.level,
        difficulty_score=course.difficulty_score,
        description=course.description,
        created_by=user_to_schema(
            course.created_by) if course.created_by else None,
        created_at=course.created_at.isoformat(),
        updated_at=course.updated_at.isoformat(),
    )


def enrollment_to_schema(enrollment: Enrollment) -> EnrollmentSchema:
    return EnrollmentSchema(
        id=enrollment.id,
        user=user_to_schema(enrollment.user),
        course=course_to_schema(enrollment.course),
        enrolled_at=enrollment.enrolled_at.isoformat(),
    )


def progress_to_schema(progress: LearningProgress) -> LearningProgressSchema:
    return LearningProgressSchema(
        id=progress.id,
        user=user_to_schema(progress.user),
        course=course_to_schema(progress.course),
        progress=progress.progress,
        last_accessed=progress.last_accessed.isoformat(),
    )


def interaction_to_schema(interaction: UserInteraction) -> UserInteractionSchema:
    return UserInteraction(
        id=interaction.id,
        user=user_to_schema(interaction.user),
        course=course_to_schema(interaction.course),
        interaction_type=interaction.interaction_type,
        rating=interaction.rating,
        timestamp=interaction.timestamp.isoformat(),
    )


@api_controller("/users")
class UserController(ControllerBase):
    def __init__(self):
        self.auth = auth  # Authentication dependency

    @route.get("", auth=auth, response=List[UserDetailSchema])
    def list_users(self, request):
        if not has_user_permission(request, "GET"):
            raise HttpError(403, "Permission denied")
        if is_admin(request):
            return [user_to_schema(user) for user in CustomUser.objects.all()]
        return [user_to_schema(request.user)]

    @route.get("/me", auth=auth, response=UserDetailSchema)
    def get_current_user(self, request):
        if not request.user.is_authenticated:
            raise HttpError(401, "Authentication required")
        print(
            f"Authenticated user ID: {request.user.id}, Email: {request.user.email}")
        return user_to_schema(request.user)

    @route.get("/{user_id}", auth=auth, response=Union[UserDetailSchema, dict])
    def get_user(self, request, user_id: int):
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return {"message": "User does not exist!"}
        if not has_user_permission(request, "GET", user):
            raise HttpError(403, "Permission denied")
        return user_to_schema(user)

    @route.put("/{user_id}", auth=auth, response=UserDetailSchema)
    def update_user(self, request, user_id: int, payload: UserDetailSchema):
        user = CustomUser.objects.get(id=user_id)
        if not has_user_permission(request, "PUT", user):
            raise HttpError(403, "Permission denied")

        user.username = payload.username
        user.email = payload.email
        user.role = payload.role
        user.preferred_subject = payload.preferred_subject
        user.save()

        profile, created = Profile.objects.get_or_create(user=user)
        profile_data = payload.profile.dict(exclude_unset=True)
        for attr, value in profile_data.items():
            if attr == "date_of_birth" and value:
                # Convert string to date
                value = datetime.strptime(value, "%Y-%m-%d").date()
            setattr(profile, attr, value)
        profile.save()

        return user_to_schema(user)

    @route.delete("/{user_id}", auth=auth)
    def delete_user(self, request, user_id: int):
        user = CustomUser.objects.get(id=user_id)
        if not has_user_permission(request, "DELETE", user):
            raise HttpError(403, "Permission denied")
        user.delete()
        return {"success": True}

# Course Endpoints (from apps.core.api)


@api_controller("/courses")
class CourseController:
    @http_get("", auth=auth, response=List[CourseSchema])
    def list_courses(self, request):
        if not has_course_permission(request, "GET"):
            raise HttpError(403, "Permission denied")
        courses = Course.objects.all().order_by('-created_at')
        return [course_to_schema(course) for course in courses]

    @http_get("/{course_id}", auth=auth, response=CourseSchema)
    def get_course(self, request, course_id: int):
        course = Course.objects.get(id=course_id)
        if not has_course_permission(request, "GET", course):
            raise HttpError(403, "Permission denied")
        return course_to_schema(course)

    @http_post("", auth=auth, response=CourseSchema)
    def create_course(self, request, payload: CourseCreateSchema):
        if not has_course_permission(request, "POST"):
            raise HttpError(403, "Permission denied")
        course = Course.objects.create(
            title=payload.title,
            subject=payload.subject,
            level=payload.level,
            difficulty_score=payload.difficulty_score,
            description=payload.description,
            created_by=request.user
        )
        return course_to_schema(course)

    @http_put("/{course_id}", auth=auth, response=CourseSchema)
    def update_course(self, request, course_id: int, payload: CourseCreateSchema):
        course = Course.objects.get(id=course_id)
        if not has_course_permission(request, "PUT", course):
            raise HttpError(403, "Permission denied")
        for attr, value in payload.dict().items():
            setattr(course, attr, value)
        course.save()
        return course_to_schema(course)

    @http_delete("/{course_id}", auth=auth)
    def delete_course(self, request, course_id: int):
        course = Course.objects.get(id=course_id)
        if not has_course_permission(request, "DELETE", course):
            raise HttpError(403, "Permission denied")
        course.delete()
        return {"success": True}

# Enrollment Endpoints (from apps.core.api)


@api_controller("/enrollments")
class EnrollmentController:
    @route.get("", auth=auth, response=List[EnrollmentSchema])
    def list_enrollments(self, request):
        if not has_enrollment_permission(request, "GET"):
            raise HttpError(403, "Permission denied")
        if is_admin_core(request) or is_teacher(request):
            enrollments = Enrollment.objects.all()
        else:
            enrollments = Enrollment.objects.filter(user=request.user)
        return [enrollment_to_schema(enrollment) for enrollment in enrollments]

    @route.get("/{enrollment_id}", auth=auth, response=EnrollmentSchema)
    def get_enrollment(self, request, enrollment_id: int):
        enrollment = Enrollment.objects.get(id=enrollment_id)
        if not has_enrollment_permission(request, "GET", enrollment):
            raise HttpError(403, "Permission denied")
        return enrollment_to_schema(enrollment)

    @route.post("", auth=auth, response=EnrollmentSchema)
    def create_enrollment(self, request, payload: EnrollmentCreateSchema):
        if not has_enrollment_permission(request, "POST"):
            raise HttpError(403, "Permission denied")
        course = Course.objects.get(id=payload.course_id)
        enrollment = Enrollment.objects.create(
            user=request.user, course=course)
        return enrollment_to_schema(enrollment)

    @route.delete("/{enrollment_id}", auth=auth)
    def delete_enrollment(self, request, enrollment_id: int):
        enrollment = Enrollment.objects.get(id=enrollment_id)
        if not has_enrollment_permission(request, "DELETE", enrollment):
            raise HttpError(403, "Permission denied")
        enrollment.delete()
        return {"success": True}
# UserInteraction Endpoints (from apps.core.api)


@api_controller("/interactions")
class UserInteractionController:
    @http_get("", auth=auth, response=List[UserInteractionSchema])
    def list_interactions(self, request):
        if not has_interaction_permission(request, "GET"):
            raise HttpError(403, "Permission denied")
        if is_admin_core(request) or is_teacher(request):
            return UserInteraction.objects.all()
        interactions = UserInteraction.objects.filter(user=request.user)
        return [interaction_to_schema(interaction) for interaction in interactions]

    @http_get("/{interaction_id}", auth=auth, response=UserInteractionSchema)
    def get_interaction(self, request, interaction_id: int):
        interaction = UserInteraction.objects.get(id=interaction_id)
        if not has_interaction_permission(request, "GET", interaction):
            raise HttpError(403, "Permission denied")
        return interaction_to_schema(interaction)

    @http_post("", auth=auth, response=UserInteractionSchema)
    def create_interaction(self, request, payload: UserInteractionCreateSchema):
        if not has_interaction_permission(request, "POST"):
            raise HttpError(403, "Permission denied")
        interaction = UserInteraction.objects.create(
            user=request.user,
            course_id=payload.course_id,
            interaction_type=payload.interaction_type,
            rating=payload.rating
        )
        return interaction_to_schema(interaction)

    @http_delete("/{interaction_id}", auth=auth)
    def delete_interaction(self, request, interaction_id: int):
        interaction = UserInteraction.objects.get(id=interaction_id)
        if not has_interaction_permission(request, "DELETE", interaction):
            raise HttpError(403, "Permission denied")
        interaction.delete()
        return {"success": True}

# LearningProgress Endpoints (from apps.core.api)


@api_controller("/progress")
class LearningProgressController:
    @http_get("", auth=auth, response=List[LearningProgressSchema])
    def list_progress(self, request):
        if not has_progress_permission(request, "GET"):
            raise HttpError(403, "Permission denied")
        if is_admin_core(request) or is_teacher(request):
            return LearningProgress.objects.all()
        progress = LearningProgress.objects.filter(user=request.user)
        return [progress_to_schema(p) for p in progress]

    @http_get("/{progress_id}", auth=auth, response=LearningProgressSchema)
    def get_progress(self, request, progress_id: int):
        progress = LearningProgress.objects.get(id=progress_id)
        if not has_progress_permission(request, "GET", progress):
            raise HttpError(403, "Permission denied")
        return progress_to_schema(progress)

    @http_put("/{progress_id}", auth=auth, response=LearningProgressSchema)
    def update_progress(self, request, progress_id: int, payload: LearningProgressUpdateSchema):
        progress = LearningProgress.objects.get(id=progress_id)
        if not has_progress_permission(request, "PUT", progress):
            raise HttpError(403, "Permission denied")
        progress.progress = payload.progress
        progress.save()
        return progress_to_schema(progress)

    @http_delete("/{progress_id}", auth=auth)
    def delete_progress(self, request, progress_id: int):
        progress = LearningProgress.objects.get(id=progress_id)
        if not has_progress_permission(request, "DELETE", progress):
            raise HttpError(403, "Permission denied")
        progress.delete()
        return {"success": True}

# Recommendation Endpoint (from apps.core.api)


@api_controller("/recommend")
class RecommendationController:
    @http_get("", auth=auth, response=PersonalizedRecommendationResponse)
    def recommend(
        self,
        request,
        subject: Optional[str] = None,
        level: Optional[str] = None,
        top_n: Optional[int] = 3
    ):
        if not request.user.is_authenticated:
            raise HttpError(401, "Authentication required")

        if not is_student(request):
            raise HttpError(
                403, "Only students can access personalized recommendations")

        user_id = request.user.id
        recommended_course_ids, status_message = recommend_courses(
            user_id=user_id,
            top_n=top_n,
            subject=subject,
            level=level
        )
        recommended_courses = Course.objects.filter(
            id__in=recommended_course_ids)

        if not recommended_courses.exists():
            return {
                "message": status_message or "No personalized recommendations available.",
                "courses": []
            }
        serialized_courses = [course_to_schema(
            course) for course in recommended_courses]
        return {
            "message": status_message or "Personalized recommendations generated successfully.",
            "courses": serialized_courses
        }


# Register all controllers
api.register_controllers(
    AuthController,
    UserController,
    CourseController,
    EnrollmentController,
    UserInteractionController,
    LearningProgressController,
    RecommendationController
)
