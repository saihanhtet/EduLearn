from django.db import models
from django.core.validators import URLValidator
from django.contrib.auth.models import BaseUserManager, PermissionsMixin, AbstractBaseUser, Permission
import logging

logger = logging.getLogger(__name__)

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        if not username:
            raise ValueError('The Username field must be set')

        email = self.normalize_email(email)
        extra_fields.setdefault('role', 'student')
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        self._assign_permissions(user)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')

        return self.create_user(email, username, password, **extra_fields)

    def _assign_permissions(self, user):
        """
        Dynamically assign permissions to a user based on their role.
        """
        role_permissions = {
            "student": {
                "users": [
                    "can_view_own_profile",
                    "can_view_own_profile_details",
                ],
                "core": [
                    "can_view_course",
                    "can_view_chapter",
                    "can_view_assignment",
                    "can_submit_assignment",
                    "can_view_submission",
                    "can_enroll_course",
                    "can_view_enrollment",
                    "can_delete_enrollment",
                    "can_log_interaction",
                    "can_view_interaction",
                    "can_update_progress",
                    "can_view_progress",
                ],
            },
            "teacher": {
                "users": [
                    "can_view_users",
                    "can_view_profiles",
                ],
                "core": [
                    "can_view_course",
                    "can_create_course",
                    "can_edit_course",
                    "can_delete_course",
                    "can_view_chapter",
                    "can_create_chapter",
                    "can_edit_chapter",
                    "can_delete_chapter",
                    "can_view_assignment",
                    "can_create_assignment",
                    "can_edit_assignment",
                    "can_delete_assignment",
                    "can_grade_assignment",
                    "can_view_submission",
                    "can_view_enrollment",
                    "can_log_interaction",
                    "can_view_interaction",
                    "can_delete_interaction",
                    "can_update_progress",
                    "can_view_progress",
                    "can_delete_progress",
                ],
            },
            "admin": {
                "users": [
                    "can_view_users",
                    "can_edit_users",
                    "can_delete_users",
                    "can_view_profiles",
                    "can_edit_profiles",
                    "can_delete_profiles",
                ],
                "core": [
                    "can_view_course",
                    "can_create_course",
                    "can_edit_course",
                    "can_delete_course",
                    "can_view_chapter",
                    "can_create_chapter",
                    "can_edit_chapter",
                    "can_delete_chapter",
                    "can_view_assignment",
                    "can_create_assignment",
                    "can_edit_assignment",
                    "can_delete_assignment",
                    "can_submit_assignment",
                    "can_grade_assignment",
                    "can_view_submission",
                    "can_enroll_course",
                    "can_view_enrollment",
                    "can_delete_enrollment",
                    "can_log_interaction",
                    "can_view_interaction",
                    "can_delete_interaction",
                    "can_update_progress",
                    "can_view_progress",
                    "can_delete_progress",
                ],
            },
        }

        try:
            logger.info(
                f"Assigning permissions for user {user.email} with role '{user.role}'")
            if user.is_superuser:
                logger.info(
                    f"Superuser {user.email} created with all permissions (role: {user.role}).")
                return  # Superusers get all permissions implicitly

            permissions_to_assign = role_permissions.get(user.role, {})
            if not permissions_to_assign:
                logger.warning(
                    f"No permissions defined for role '{user.role}' for user {user.email}")
                return

            user_permissions = []
            for app_label, codenames in permissions_to_assign.items():
                for codename in codenames:
                    try:
                        permission = Permission.objects.get(
                            codename=codename,
                            content_type__app_label=app_label
                        )
                        user_permissions.append(permission)
                    except Permission.DoesNotExist:
                        logger.error(
                            f"Permission '{app_label}.{codename}' does not exist for user {user.email}. "
                            "Ensure migrations are applied."
                        )

            if user_permissions:
                user.user_permissions.set(user_permissions)
                logger.info(
                    f"Assigned {len(user_permissions)} permissions to {user.email}")
            else:
                logger.info(
                    f"No permissions assigned to {user.email} (no matching permissions found)")

        except Exception as e:
            logger.error(
                f"Error assigning permissions to {user.email}: {str(e)}")
            raise


class CustomUser(AbstractBaseUser, PermissionsMixin):
    ROLES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )

    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(max_length=10, choices=ROLES, default='student')
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    preferred_subject = models.CharField(max_length=50, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    def __str__(self) -> str:
        return self.email

    @property
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser

    class Meta:
        permissions = [
            ("can_view_own_profile", "Can view own user details"),
            ("can_view_users", "Can view all users"),
            ("can_edit_users", "Can edit users"),
            ("can_delete_users", "Can delete users"),
        ]


class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE)
    bio = models.TextField(max_length=500, blank=True)
    website = models.URLField(validators=[URLValidator()], blank=True)
    gender = models.CharField(
        max_length=10, choices=[('Male', 'Male'), ('Female', 'Female'), ('Other', 'Other')], blank=True
    )
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    account_status = models.CharField(
        max_length=10, choices=[('Active', 'Active'), ('Inactive', 'Inactive'), ('Suspended', 'Suspended')],
        default='Active'
    )
    joined_date = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f'{self.user.username} Profile'

    class Meta:
        permissions = [
            ("can_view_own_profile_details", "Can view own profile details"),
            ("can_view_profiles", "Can view all profiles"),
            ("can_edit_profiles", "Can edit profiles"),
            ("can_delete_profiles", "Can delete profiles"),
        ]
