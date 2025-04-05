from typing import Optional, Union, List
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import Permission
from django.utils import timezone


from ninja import File
from ninja.files import UploadedFile
from django.http import HttpRequest
from ninja_extra import ControllerBase, NinjaExtraAPI, api_controller, http_get, http_post, http_put, http_delete, route
from ninja_jwt.controller import NinjaJWTDefaultController
from ninja.errors import HttpError
from ninja_extra import api_controller, http_get

from apps.users.models import CustomUser
from apps.core.utils.recommendation import recommend_courses
from apps.users.models import CustomUser, Profile
from apps.users.schemas import ProfileSchema, UserDetailSchema, RegisterSchema
from apps.core.permissions import is_admin, has_user_permission
from apps.core.models import (
    Course, Enrollment, UserInteraction, LearningProgress,
    Assignment, AssignmentSubmission, Chapter, Enrollment,
    Course, LearningProgress
)
from apps.core.permissions import (
    is_admin as is_admin_core, is_teacher, is_student, has_course_permission,
    has_enrollment_permission, has_interaction_permission, has_progress_permission
)
from .schemas import (
    AssignmentCreateSchema, AssignmentSchema, AssignmentSubmissionCreateSchema,
    AssignmentSubmissionSchema, AssignmentSubmissionUpdateSchema, ChapterCreateSchema,
    ChapterSchema, CourseUpdateSchema, DebugJWTAuth, EnrollmentCreateSchema, CourseSchema,
    CourseCreateSchema, CourseCreateSchema, EnrollmentSchema, ImageUploadSchema,
    UserInteractionSchema, UserInteractionCreateSchema, LearningProgressSchema,
    LearningProgressUpdateSchema, PersonalizedRecommendationResponse,
    DashboardResponseSchema, StudentDashboardSchema, AdminDashboardSchema, TeacherDashboardSchema
)

# Create a single NinjaExtraAPI instance
api = NinjaExtraAPI()

# Use DebugJWTAuth for all endpoints
auth = DebugJWTAuth()

# Register the JWT controller for token endpoints (/api/token/pair, /api/token/refresh)
api.register_controllers(NinjaJWTDefaultController)


def calculate_percentage_change(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return ((current - previous) / previous) * 100


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
            joined_date=profile.joined_date.isoformat() if profile else None,
        )
    )


def course_to_schema(course: Course) -> CourseSchema:
    return CourseSchema(
        id=course.id,
        title=course.title,
        subject=course.subject,
        level=course.level,
        price=float(course.price) if course.price is not None else None,
        image=course.image.url if course.image else None,
        difficulty_score=course.difficulty_score,
        description=course.description,
        status=course.status,
        created_by=user_to_schema(
            course.created_by) if course.created_by else None,
        created_at=course.created_at.isoformat(),
        updated_at=course.updated_at.isoformat(),
    )


def chapter_to_schema(chapter: Chapter) -> ChapterSchema:
    return ChapterSchema(
        id=chapter.id,
        course=course_to_schema(chapter.course),
        title=chapter.title,
        order=chapter.order,
        description=chapter.description,
        video=chapter.video.url if chapter.video else None,
        pdf=chapter.pdf.url if chapter.pdf else None,
        text_content=chapter.text_content,
        created_at=chapter.created_at.isoformat(),
        updated_at=chapter.updated_at.isoformat(),
    )


def assignment_to_schema(assignment: Assignment) -> AssignmentSchema:
    return AssignmentSchema(
        id=assignment.id,
        chapter=chapter_to_schema(assignment.chapter),
        title=assignment.title,
        description=assignment.description,
        max_score=assignment.max_score,
        due_date=assignment.due_date.isoformat() if assignment.due_date else None,
        created_at=assignment.created_at.isoformat(),
        updated_at=assignment.updated_at.isoformat(),
    )


def submission_to_schema(submission: AssignmentSubmission) -> AssignmentSubmissionSchema:
    return AssignmentSubmissionSchema(
        id=submission.id,
        assignment=assignment_to_schema(submission.assignment),
        user=user_to_schema(submission.user),
        file=submission.file.url if submission.file else None,
        text_submission=submission.text_submission,
        score=submission.score,
        feedback=submission.feedback,
        submitted_at=submission.submitted_at.isoformat(),
        graded_at=submission.graded_at.isoformat() if submission.graded_at else None,
    )


def enrollment_to_schema(enrollment: Enrollment) -> EnrollmentSchema:
    # Fetch progress from LearningProgress
    progress_obj = LearningProgress.objects.filter(
        user=enrollment.user, course=enrollment.course).first()
    progress = progress_obj.progress if progress_obj else 0.0

    # Fetch completed status from UserInteraction
    completed = UserInteraction.objects.filter(
        user=enrollment.user,
        course=enrollment.course,
        interaction_type="completed"
    ).exists()

    return EnrollmentSchema(
        id=enrollment.id,
        user=user_to_schema(enrollment.user),
        course=course_to_schema(enrollment.course),
        enrolled_at=enrollment.enrolled_at.isoformat(),
        progress=progress,
        completed=completed,
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


@api_controller("/dashboard")
class DashboardController(ControllerBase):
    def __init__(self):
        self.auth = auth

    def calculate_percentage_change(self, current: float, previous: float) -> float:
        if previous == 0:
            return 100.0 if current > 0 else 0.0
        return ((current - previous) / previous) * 100

    @http_get("", response=DashboardResponseSchema, auth=auth)
    def get_dashboard_data(self, request):
        if not request.user.is_authenticated:
            raise HttpError(401, "Unauthorized")

        role = request.user.role  # Assuming CustomUser has a role field
        current_date = timezone.now()
        # Define the start of the current month and previous month
        current_month_start = current_date.replace(
            day=1, hour=0, minute=0, second=0, microsecond=0)
        previous_month_start = current_month_start - relativedelta(months=1)
        previous_month_end = current_month_start - timedelta(seconds=1)

        dashboard_data = {}

        if role == "student":
            # Current month data
            current_enrollments = Enrollment.objects.filter(
                user=request.user,
                enrolled_at__gte=current_month_start,
                enrolled_at__lte=current_date
            ).count()
            previous_enrollments = Enrollment.objects.filter(
                user=request.user,
                enrolled_at__gte=previous_month_start,
                enrolled_at__lte=previous_month_end
            ).count()
            enrollments = Enrollment.objects.filter(user=request.user).count()
            progress = LearningProgress.objects.filter(user=request.user)
            current_progress = LearningProgress.objects.filter(
                user=request.user,
                last_accessed__gte=current_month_start,
                last_accessed__lte=current_date
            )
            previous_progress = LearningProgress.objects.filter(
                user=request.user,
                last_accessed__gte=previous_month_start,
                last_accessed__lte=previous_month_end
            )
            current_avg_progress = (
                sum(p.progress for p in current_progress) /
                len(current_progress) if current_progress else 0.0
            )
            previous_avg_progress = (
                sum(p.progress for p in previous_progress) /
                len(previous_progress) if previous_progress else 0.0
            )
            avg_progress = sum(p.progress for p in progress) / \
                len(progress) if progress else 0.0
            completed_courses = progress.filter(progress=100).count()
            current_completed = current_progress.filter(progress=100).count()
            previous_completed = previous_progress.filter(progress=100).count()

            dashboard_data["student"] = StudentDashboardSchema(
                enrolledCourses=enrollments,
                enrolledCoursesChange=self.calculate_percentage_change(
                    current_enrollments, previous_enrollments),
                averageProgress=round(avg_progress, 2),
                averageProgressChange=self.calculate_percentage_change(
                    current_avg_progress, previous_avg_progress),
                completedCourses=completed_courses,
                completedCoursesChange=self.calculate_percentage_change(
                    current_completed, previous_completed),
            )

        elif role == "admin":
            # Current month data
            current_enrollments = Enrollment.objects.filter(
                enrolled_at__gte=current_month_start,
                enrolled_at__lte=current_date
            ).count()
            previous_enrollments = Enrollment.objects.filter(
                enrolled_at__gte=previous_month_start,
                enrolled_at__lte=previous_month_end
            ).count()
            enrollments = Enrollment.objects.count()
            courses = Course.objects.all()
            current_courses = Course.objects.filter(
                created_at__gte=current_month_start,
                created_at__lte=current_date
            ).count()
            previous_courses = Course.objects.filter(
                created_at__gte=previous_month_start,
                created_at__lte=previous_month_end
            ).count()
            # Assuming $10 per enrollment for revenue
            total_revenue = enrollments * 10
            current_revenue = current_enrollments * 10
            previous_revenue = previous_enrollments * 10

            dashboard_data["admin"] = AdminDashboardSchema(
                totalRevenue=total_revenue,
                totalRevenueChange=self.calculate_percentage_change(
                    current_revenue, previous_revenue),
                totalEnrollments=enrollments,
                totalEnrollmentsChange=self.calculate_percentage_change(
                    current_enrollments, previous_enrollments),
                monthlyProfitChange=4.5,  # Replace with real calculation if needed
                activeCourses=courses.count(),
                activeCoursesChange=self.calculate_percentage_change(
                    current_courses, previous_courses),
            )

        elif role == "teacher":
            # Current month data
            teacher_courses = Course.objects.filter(created_by=request.user)
            current_courses = Course.objects.filter(
                created_by=request.user,
                created_at__gte=current_month_start,
                created_at__lte=current_date
            ).count()
            previous_courses = Course.objects.filter(
                created_by=request.user,
                created_at__gte=previous_month_start,
                created_at__lte=previous_month_end
            ).count()
            enrollments = Enrollment.objects.filter(course__in=teacher_courses)
            current_enrollments = Enrollment.objects.filter(
                course__in=teacher_courses,
                enrolled_at__gte=current_month_start,
                enrolled_at__lte=current_date
            ).count()
            previous_enrollments = Enrollment.objects.filter(
                course__in=teacher_courses,
                enrolled_at__gte=previous_month_start,
                enrolled_at__lte=previous_month_end
            ).count()
            progress = LearningProgress.objects.filter(
                course__in=teacher_courses)
            current_progress = LearningProgress.objects.filter(
                course__in=teacher_courses,
                last_accessed__gte=current_month_start,
                last_accessed__lte=current_date
            )
            previous_progress = LearningProgress.objects.filter(
                course__in=teacher_courses,
                last_accessed__gte=previous_month_start,
                last_accessed__lte=previous_month_end
            )
            current_engagement = (
                sum(p.progress for p in current_progress) /
                len(current_progress) if current_progress else 0.0
            )
            previous_engagement = (
                sum(p.progress for p in previous_progress) /
                len(previous_progress) if previous_progress else 0.0
            )
            student_engagement = sum(
                p.progress for p in progress) / len(progress) if progress else 0.0

            dashboard_data["teacher"] = TeacherDashboardSchema(
                createdCourses=teacher_courses.count(),
                createdCoursesChange=self.calculate_percentage_change(
                    current_courses, previous_courses),
                studentEngagement=round(student_engagement, 2),
                studentEngagementChange=self.calculate_percentage_change(
                    current_engagement, previous_engagement),
                enrollmentsInCourses=enrollments.count(),
                enrollmentsInCoursesChange=self.calculate_percentage_change(
                    current_enrollments, previous_enrollments),
            )

        return dashboard_data

# User Endpoints (from apps.users.api)

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
            price=payload.price,
            image=payload.image,
            status=payload.status,
            created_by=request.user
        )
        return course_to_schema(course)

    @http_post("/{course_id}/upload-image", auth=auth, response=CourseSchema)
    def upload_course_image(self, request, course_id: int, image: UploadedFile = File(None)):
        print(f"Received image: {image}")
        course = Course.objects.get(id=course_id)
        if not has_course_permission(request, "PUT", course):
            raise HttpError(403, "Permission denied")
        if image:
            old_image_path = course.image.path if course.image else "No previous image"
            course.image.save(image.name, image, save=True)
            print(f"Old image path: {old_image_path}")
            print(f"New image saved to: {course.image.path}")
            print(f"DB path: {course.image.name}")
        course.save()
        return course_to_schema(course)

    @http_put("/{course_id}", auth=auth, response=CourseSchema)
    def update_course(self, request, course_id: int, payload: CourseUpdateSchema):
        course = Course.objects.get(id=course_id)
        if not has_course_permission(request, "PUT", course):
            raise HttpError(403, "Permission denied")
        # Update only the fields provided in the payload
        for attr, value in payload.dict(exclude_unset=True).items():
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


@api_controller("/chapters")
class ChapterController(ControllerBase):
    @http_get("", auth=auth, response=List[ChapterSchema])
    def list_chapters(self, request, course_id: Optional[int] = None):
        # Adjust permission as needed
        if not has_course_permission(request, "GET"):
            raise HttpError(403, "Permission denied")
        chapters = Chapter.objects.filter(
            course_id=course_id) if course_id else Chapter.objects.all()
        return [chapter_to_schema(chapter) for chapter in chapters]

    @http_get("/{chapter_id}", auth=auth, response=ChapterSchema)
    def get_chapter(self, request, chapter_id: int):
        chapter = Chapter.objects.get(id=chapter_id)
        if not has_course_permission(request, "GET", chapter.course):
            raise HttpError(403, "Permission denied")
        return chapter_to_schema(chapter)

    @http_post("", auth=auth, response=ChapterSchema)
    def create_chapter(self, request, payload: ChapterCreateSchema):
        if not has_course_permission(request, "POST"):
            raise HttpError(403, "Permission denied")
        course = Course.objects.get(id=payload.course_id)
        if course.created_by != request.user and not is_admin(request):
            raise HttpError(
                403, "Only the course creator or admin can add chapters")
        chapter = Chapter.objects.create(
            course=course, title=payload.title, order=payload.order, description=payload.description,
            video=payload.video, pdf=payload.pdf, text_content=payload.text_content)
        return chapter_to_schema(chapter)

    @http_put("/{chapter_id}", auth=auth, response=ChapterSchema)
    def update_chapter(self, request, chapter_id: int, payload: ChapterCreateSchema):
        chapter = Chapter.objects.get(id=chapter_id)
        if not has_course_permission(request, "PUT", chapter.course):
            raise HttpError(403, "Permission denied")
        if chapter.course.created_by != request.user and not is_admin(request):
            raise HttpError(
                403, "Only the course creator or admin can edit chapters")
        chapter.course = Course.objects.get(id=payload.course_id)
        for attr, value in payload.dict(exclude={'course_id'}).items():
            setattr(chapter, attr, value)
        chapter.save()
        return chapter_to_schema(chapter)

    @http_delete("/{chapter_id}", auth=auth)
    def delete_chapter(self, request, chapter_id: int):
        chapter = Chapter.objects.get(id=chapter_id)
        if not has_course_permission(request, "DELETE", chapter.course):
            raise HttpError(403, "Permission denied")
        if chapter.course.created_by != request.user and not is_admin(request):
            raise HttpError(
                403, "Only the course creator or admin can delete chapters")
        chapter.delete()
        return {"success": True}


@api_controller("/assignments")
class AssignmentController(ControllerBase):
    @http_get("", auth=auth, response=List[AssignmentSchema])
    def list_assignments(self, request, chapter_id: Optional[int] = None):
        # Adjust permission as needed
        if not has_course_permission(request, "GET"):
            raise HttpError(403, "Permission denied")
        assignments = Assignment.objects.filter(
            chapter_id=chapter_id) if chapter_id else Assignment.objects.all()
        return [assignment_to_schema(assignment) for assignment in assignments]

    @http_get("/{assignment_id}", auth=auth, response=AssignmentSchema)
    def get_assignment(self, request, assignment_id: int):
        assignment = Assignment.objects.get(id=assignment_id)
        if not has_course_permission(request, "GET", assignment.chapter.course):
            raise HttpError(403, "Permission denied")
        return assignment_to_schema(assignment)

    @http_post("", auth=auth, response=AssignmentSchema)
    def create_assignment(self, request, payload: AssignmentCreateSchema):
        if not has_course_permission(request, "POST"):
            raise HttpError(403, "Permission denied")
        chapter = Chapter.objects.get(id=payload.chapter_id)
        if chapter.course.created_by != request.user and not is_admin(request):
            raise HttpError(
                403, "Only the course creator or admin can add assignments")
        assignment = Assignment.objects.create(
            chapter=chapter, title=payload.title, description=payload.description,
            max_score=payload.max_score, due_date=payload.due_date)
        return assignment_to_schema(assignment)

    @http_put("/{assignment_id}", auth=auth, response=AssignmentSchema)
    def update_assignment(self, request, assignment_id: int, payload: AssignmentCreateSchema):
        assignment = Assignment.objects.get(id=assignment_id)
        if not has_course_permission(request, "PUT", assignment.chapter.course):
            raise HttpError(403, "Permission denied")
        if assignment.chapter.course.created_by != request.user and not is_admin(request):
            raise HttpError(
                403, "Only the course creator or admin can edit assignments")
        assignment.chapter = Chapter.objects.get(id=payload.chapter_id)
        for attr, value in payload.dict(exclude={'chapter_id'}).items():
            setattr(assignment, attr, value)
        assignment.save()
        return assignment_to_schema(assignment)

    @http_delete("/{assignment_id}", auth=auth)
    def delete_assignment(self, request, assignment_id: int):
        assignment = Assignment.objects.get(id=assignment_id)
        if not has_course_permission(request, "DELETE", assignment.chapter.course):
            raise HttpError(403, "Permission denied")
        if assignment.chapter.course.created_by != request.user and not is_admin(request):
            raise HttpError(
                403, "Only the course creator or admin can delete assignments")
        assignment.delete()
        return {"success": True}


@api_controller("/submissions")
class AssignmentSubmissionController(ControllerBase):
    @http_get("", auth=auth, response=List[AssignmentSubmissionSchema])
    def list_submissions(self, request, assignment_id: Optional[int] = None):
        if not (is_student(request) or is_teacher(request) or is_admin(request)):
            raise HttpError(403, "Permission denied")
        if is_student(request):
            submissions = AssignmentSubmission.objects.filter(
                user=request.user)
        elif assignment_id:
            submissions = AssignmentSubmission.objects.filter(
                assignment_id=assignment_id)
        else:
            submissions = AssignmentSubmission.objects.all()
        return [submission_to_schema(submission) for submission in submissions]

    @http_get("/{submission_id}", auth=auth, response=AssignmentSubmissionSchema)
    def get_submission(self, request, submission_id: int):
        submission = AssignmentSubmission.objects.get(id=submission_id)
        if submission.user != request.user and not (is_teacher(request) or is_admin(request)):
            raise HttpError(403, "Permission denied")
        return submission_to_schema(submission)

    @http_post("", auth=auth, response=AssignmentSubmissionSchema)
    def create_submission(self, request, payload: AssignmentSubmissionCreateSchema):
        if not is_student(request):
            raise HttpError(403, "Only students can submit assignments")
        assignment = Assignment.objects.get(id=payload.assignment_id)
        if AssignmentSubmission.objects.filter(assignment=assignment, user=request.user).exists():
            raise HttpError(400, "You have already submitted this assignment")
        submission = AssignmentSubmission.objects.create(
            assignment=assignment, user=request.user, file=payload.file, text_submission=payload.text_submission)
        return submission_to_schema(submission)

    @http_put("/{submission_id}", auth=auth, response=AssignmentSubmissionSchema)
    def update_submission(self, request, submission_id: int, payload: AssignmentSubmissionUpdateSchema):
        submission = AssignmentSubmission.objects.get(id=submission_id)
        if not (is_teacher(request) or is_admin(request)):
            raise HttpError(
                403, "Only teachers or admins can grade submissions")
        if submission.assignment.chapter.course.created_by != request.user and not is_admin(request):
            raise HttpError(
                403, "Only the course creator or admin can grade this submission")
        if payload.score is not None:
            submission.score = payload.score
            submission.graded_at = timezone.now()
        if payload.feedback is not None:
            submission.feedback = payload.feedback
        submission.save()
        return submission_to_schema(submission)

    @http_delete("/{submission_id}", auth=auth)
    def delete_submission(self, request, submission_id: int):
        submission = AssignmentSubmission.objects.get(id=submission_id)
        if submission.user != request.user and not (is_teacher(request) or is_admin(request)):
            raise HttpError(403, "Permission denied")
        submission.delete()
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
    RecommendationController,
    DashboardController
)
