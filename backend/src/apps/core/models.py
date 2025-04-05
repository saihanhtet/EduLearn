# core/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Course(models.Model):
    LEVEL_CHOICES = (
        ("Beginner", "Beginner"),
        ("Intermediate", "Intermediate"),
        ("Advanced", "Advanced"),
    )
    STATUS = (
        ("Draft", "Draft"),
        ("Under Review", "Under Review"),
        ("Published", "Published"),
    )
    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=100, null=True, blank=True)
    level = models.CharField(
        max_length=20, choices=LEVEL_CHOICES, null=True, blank=True)
    difficulty_score = models.FloatField(default=1.0)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, blank=True, null=True)
    image = models.ImageField(
        upload_to='course_images/', blank=True, null=True)
    status = models.CharField(max_length=20,
                              choices=STATUS, default='Draft', null=True, blank=True)
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


class Chapter(models.Model):
    course = models.ForeignKey(
        Course, on_delete=models.CASCADE, related_name="chapters")
    title = models.CharField(max_length=200)
    order = models.PositiveIntegerField(default=0)  # For ordering chapters
    description = models.TextField(blank=True, null=True)

    # Content fields (one or more can be populated)
    video = models.FileField(
        upload_to='chapter_videos/', blank=True, null=True, help_text="Upload a video file (e.g., MP4)")
    pdf = models.FileField(
        upload_to='chapter_pdfs/', blank=True, null=True, help_text="Upload a PDF file")
    text_content = models.TextField(
        blank=True, null=True, help_text="Text content for the chapter")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.course.title} - Chapter {self.order}: {self.title}"

    class Meta:
        ordering = ['order']  # Chapters ordered by 'order' field
        unique_together = ('course', 'order')  # Ensure unique order per course
        permissions = [
            ("can_create_chapter", "Can create chapters"),
            ("can_edit_chapter", "Can edit chapters"),
            ("can_delete_chapter", "Can delete chapters"),
            ("can_view_chapter", "Can view chapters"),
        ]


class Assignment(models.Model):
    chapter = models.OneToOneField(
        Chapter, on_delete=models.CASCADE, related_name="assignment", null=True, blank=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    max_score = models.PositiveIntegerField(
        default=100, validators=[MinValueValidator(1)], help_text="Maximum score for the assignment")
    due_date = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Assignment for {self.chapter.title}: {self.title}"

    class Meta:
        permissions = [
            ("can_create_assignment", "Can create assignments"),
            ("can_edit_assignment", "Can edit assignments"),
            ("can_delete_assignment", "Can delete assignments"),
            ("can_view_assignment", "Can view assignments"),
        ]


class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(
        Assignment, on_delete=models.CASCADE, related_name="submissions")
    user = models.ForeignKey(
        'users.CustomUser', on_delete=models.CASCADE, related_name="assignment_submissions")
    file = models.FileField(
        upload_to='assignment_submissions/', blank=True, null=True, help_text="Upload your assignment file")
    text_submission = models.TextField(
        blank=True, null=True, help_text="Text-based submission if no file")
    score = models.PositiveIntegerField(
        null=True, blank=True, validators=[MinValueValidator(0)], help_text="Score given by instructor")
    feedback = models.TextField(
        blank=True, null=True, help_text="Instructor feedback")
    submitted_at = models.DateTimeField(auto_now_add=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # One submission per user per assignment
        unique_together = ('assignment', 'user')
        permissions = [
            ("can_submit_assignment", "Can submit assignments"),
            ("can_grade_assignment", "Can grade assignments"),
            ("can_view_submission", "Can view assignment submissions"),
        ]

    def __str__(self):
        return f"{self.user.username}'s submission for {self.assignment.title}"


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
