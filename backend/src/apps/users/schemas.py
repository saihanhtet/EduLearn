from datetime import datetime
from typing import Optional
from ninja import Schema
from pydantic import BaseModel, EmailStr


class SignInSchema(BaseModel):
    email: EmailStr
    password: str


class ProfileSchema(Schema):
    bio: Optional[str] = None
    website: Optional[str] = None
    gender: Optional[str] = None  # "Male", "Female", "Other"
    date_of_birth: Optional[str] = None  # ISO format: "YYYY-MM-DD"
    phone_number: Optional[str] = None
    account_status: str = "Active"
    joined_date: datetime

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class UserDetailSchema(Schema):
    _id: int
    email: EmailStr
    username: str
    role: str  # "student", "teacher", "admin"
    preferred_subject: Optional[str] = None
    profile: ProfileSchema  # Nested profile data


class RegisterSchema(Schema):
    email: str
    username: str
    password: str
    role: str
