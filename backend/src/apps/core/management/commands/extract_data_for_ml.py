# core/scripts/extract_data_for_ml.py
import pandas as pd
from django.core.management.base import BaseCommand
from apps.core.models import Course, Enrollment, UserInteraction, LearningProgress
from apps.users.models import CustomUser
import os


class Command(BaseCommand):
    help = 'Extracts data from models for ML purposes and saves it to CSV files'

    def handle(self, *args, **options):
        self.stdout.write("Extracting data for ML...")

        # Create the ml_data directory if it doesn't exist
        if not os.path.exists('ml_data'):
            os.makedirs('ml_data')

        # Extract users
        users = CustomUser.objects.all().values('id', 'email', 'role')
        users_df = pd.DataFrame(list(users))
        users_df.to_csv('ml_data/users.csv', index=False)
        self.stdout.write("Exported users to ml_data/users.csv")

        # Extract courses
        courses = Course.objects.all().values(
            'id', 'title', 'subject', 'level', 'difficulty_score', 'description', 'created_by_id'
        )
        courses_df = pd.DataFrame(list(courses))
        courses_df.to_csv('ml_data/courses.csv', index=False)
        self.stdout.write("Exported courses to ml_data/courses.csv")

        # Extract enrollments
        enrollments = Enrollment.objects.all().values(
            'user_id', 'course_id', 'enrolled_at')
        enrollments_df = pd.DataFrame(list(enrollments))
        enrollments_df.to_csv('ml_data/enrollments.csv', index=False)
        self.stdout.write("Exported enrollments to ml_data/enrollments.csv")

        # Extract user interactions
        interactions = UserInteraction.objects.all().values(
            'user_id', 'course_id', 'interaction_type', 'rating', 'timestamp'
        )
        interactions_df = pd.DataFrame(list(interactions))
        interactions_df.to_csv('ml_data/interactions.csv', index=False)
        self.stdout.write("Exported interactions to ml_data/interactions.csv")

        # Extract learning progress
        progress = LearningProgress.objects.all().values(
            'user_id', 'course_id', 'progress', 'last_accessed'
        )
        progress_df = pd.DataFrame(list(progress))
        progress_df.to_csv('ml_data/progress.csv', index=False)
        self.stdout.write("Exported progress to ml_data/progress.csv")

        self.stdout.write(self.style.SUCCESS("Data extraction completed!"))
