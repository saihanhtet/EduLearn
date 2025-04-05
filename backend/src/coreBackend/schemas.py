from typing import Optional, List
from datetime import datetime

from ninja import Schema
from ninja import File, UploadedFile
from ninja_jwt.authentication import JWTAuth as BaseJWTAuth

from apps.users.schemas import UserDetailSchema


class DebugJWTAuth(BaseJWTAuth):
    def authenticate(self, request, token):
        user = super().authenticate(request, token)
        return user


class CustomResponse(Schema):
    success: Optional[str] = None
    error: Optional[str] = None


class ErrorResponse(Schema):
    message: Optional[str] = None


class CourseCreateSchema(Schema):
    title: str
    subject: Optional[str] = ''
    level: Optional[str] = 'Beginner'
    difficulty_score: float = 1.0
    description: Optional[str] = ''
    price: Optional[float] = 0.0
    image: Optional[str] = None
    status: Optional[str] = "Draft"


class CourseUpdateSchema(Schema):
    title: Optional[str] = None
    subject: Optional[str] = None
    level: Optional[str] = None
    difficulty_score: Optional[float] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    status: Optional[str] = None


class ImageUploadSchema(Schema):
    image: Optional[UploadedFile] = None

class CourseSchema(Schema):
    id: int
    title: str
    subject: str
    level: str
    difficulty_score: float
    description: str
    price: Optional[float]
    image: Optional[str]
    status: Optional[str] = "Draft"
    created_by: Optional[UserDetailSchema]
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class EnrollmentSchema(Schema):
    id: int
    user: UserDetailSchema
    course: CourseSchema
    enrolled_at: datetime  # Fixed: Changed to datetime
    progress: Optional[float] = 0.0  # From LearningProgress
    completed: bool = False  # From UserInteraction

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChapterSchema(Schema):
    id: int
    course: CourseSchema
    title: str
    order: int
    description: Optional[str] = None
    video: Optional[str] = None  # URL or path to video
    pdf: Optional[str] = None    # URL or path to PDF
    text_content: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChapterCreateSchema(Schema):
    course_id: int
    title: str
    order: int
    description: Optional[str] = None
    video: Optional[str] = None
    pdf: Optional[str] = None
    text_content: Optional[str] = None


class AssignmentSchema(Schema):
    id: int
    chapter: ChapterSchema
    title: str
    description: Optional[str] = None
    max_score: int
    due_date: Optional[str] = None  # ISO format
    created_at: datetime
    updated_at: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AssignmentCreateSchema(Schema):
    chapter_id: int
    title: str
    description: Optional[str] = None
    max_score: int = 100
    due_date: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AssignmentSubmissionSchema(Schema):
    id: int
    assignment: AssignmentSchema
    user: UserDetailSchema
    file: Optional[str] = None  # URL or path to file
    text_submission: Optional[str] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    submitted_at: str
    graded_at: Optional[datetime] = None

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class AssignmentSubmissionCreateSchema(Schema):
    assignment_id: int
    file: Optional[str] = None
    text_submission: Optional[str] = None


class AssignmentSubmissionUpdateSchema(Schema):
    score: Optional[int] = None
    feedback: Optional[str] = None


class EnrollmentSchema(Schema):
    id: int
    user: UserDetailSchema
    course: CourseSchema
    enrolled_at: str
    progress: float = 0.0
    completed: bool = False

class EnrollmentCreateSchema(Schema):
    course_id: int


class UserInteractionSchema(Schema):
    id: int
    user: UserDetailSchema
    course: CourseSchema
    interaction_type: str
    rating: Optional[int]
    timestamp: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserInteractionCreateSchema(Schema):
    course__id: int
    interaction_type: str
    rating: Optional[int] = None


class LearningProgressSchema(Schema):
    id: int
    user: UserDetailSchema
    course: CourseSchema
    progress: float
    last_accessed: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class LearningProgressUpdateSchema(Schema):
    progress: float


class RecommendationRequest(Schema):
    subject: Optional[str] = None
    level: Optional[str] = None
    top_n: Optional[int] = 3


class PersonalizedRecommendationResponse(Schema):
    message: str
    courses: List[CourseSchema]


class RecommendationResponse(Schema):
    message: str
    path: List[str]


class StudentDashboardSchema(Schema):
    enrolledCourses: int
    enrolledCoursesChange: float  # Percentage change in enrollments
    averageProgress: float
    averageProgressChange: float  # Percentage change in average progress
    completedCourses: int
    completedCoursesChange: float  # Percentage change in completed courses


class AdminDashboardSchema(Schema):
    totalRevenue: float
    totalRevenueChange: float  # Percentage change in revenue
    totalEnrollments: int
    totalEnrollmentsChange: float  # Percentage change in enrollments
    monthlyProfitChange: float  # Already in the schema
    activeCourses: int
    activeCoursesChange: float  # Percentage change in active courses


class TeacherDashboardSchema(Schema):
    createdCourses: int
    createdCoursesChange: float  # Percentage change in created courses
    studentEngagement: float
    studentEngagementChange: float  # Percentage change in student engagement
    enrollmentsInCourses: int
    # Percentage change in enrollments in teacher's courses
    enrollmentsInCoursesChange: float


class DashboardResponseSchema(Schema):
    student: Optional[StudentDashboardSchema] = None
    admin: Optional[AdminDashboardSchema] = None
    teacher: Optional[TeacherDashboardSchema] = None
