# core/models.py
from django.db import models


class Course(models.Model):
    LEVEL_CHOICES = (
        ("Beginner", "Beginner"),
        ("Intermediate", "Intermediate"),
        ("Advanced", "Advanced"),
    )
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    difficulty_score = models.FloatField(default=1.0)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        'users.CustomUser', on_delete=models.SET_NULL, null=True, blank=True, related_name="created_courses")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        permissions = [
            ("can_create_course", "Can create courses"),
            ("can_edit_course", "Can edit courses"),
            ("can_delete_course", "Can delete courses"),
            ("can_view_course", "Can view courses"),
        ]


class Enrollment(models.Model):
    user = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE, related_name="enrollments"
    )
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="enrollments"
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "course")
        permissions = [
            ("can_enroll_course", "Can enroll in courses"),
            ("can_view_enrollment", "Can view enrollments"),
            ("can_delete_enrollment", "Can delete enrollments"),
        ]

    def __str__(self):
        return f"{self.user.username} enrolled in {self.course.title}"


class UserInteraction(models.Model):
    INTERACTION_TYPES = (
        ("viewed", "Viewed"),
        ("rated", "Rated"),
        ("completed", "Completed"),
    )

    user = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE, related_name="interactions")
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="interactions")
    interaction_type = models.CharField(
        max_length=20, choices=INTERACTION_TYPES)
    rating = models.IntegerField(null=True, blank=True)  # 1 to 5
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} {self.interaction_type} {self.course.title}"

    class Meta:
        permissions = [
            ("can_log_interaction", "Can log interactions"),
            ("can_view_interaction", "Can view interactions"),
            ("can_delete_interaction", "Can delete interactions"),
        ]


class LearningProgress(models.Model):
    user = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE, related_name="progress")
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="progress")
    progress = models.FloatField(default=0.0)  # 0 to 100
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "course")
        permissions = [
            ("can_update_progress", "Can update learning progress"),
            ("can_view_progress", "Can view learning progress"),
            ("can_delete_progress", "Can delete learning progress"),
        ]

    def __str__(self):
        return f"{self.user.username} progress in {self.course.title}: {self.progress}%"
