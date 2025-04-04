from django.contrib import admin

# Register your models here.
from apps.core.models import Course, Enrollment, LearningProgress, UserInteraction

admin.site.register(Course)
admin.site.register(Enrollment)
admin.site.register(LearningProgress)
admin.site.register(UserInteraction)
