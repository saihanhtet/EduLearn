from typing import Optional, List
from datetime import datetime
from ninja import Schema
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
    subject: str
    level: str
    difficulty_score: float
    description: str


class CourseSchema(Schema):
    id: int
    title: str
    subject: str
    level: str
    difficulty_score: float
    description: str
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

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


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
    course_id: int
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
