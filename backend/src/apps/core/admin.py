from django.contrib import admin

# Register your models here.
from apps.core.models import Course, Enrollment, LearningProgress, UserInteraction, Assignment, AssignmentSubmission, Chapter

admin.site.register(Course)
admin.site.register(Enrollment)
admin.site.register(LearningProgress)
admin.site.register(UserInteraction)
admin.site.register(Assignment)
admin.site.register(AssignmentSubmission)
admin.site.register(Chapter)
