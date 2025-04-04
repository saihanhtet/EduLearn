# apps/core/management/commands/recommend_courses.py
import pandas as pd
from django.core.management.base import BaseCommand
from apps.core.utils.recommendation import recommend_courses


class Command(BaseCommand):
    help = 'Generate course recommendations for a user'

    def add_arguments(self, parser):
        parser.add_argument('user_id', type=int, nargs='?', default=1,
                            help='ID of the user to generate recommendations for (default: 1)')
        parser.add_argument('--top_n', type=int, default=3,
                            help='Number of recommendations to return (default: 3)')

    def handle(self, *args, **options):
        user_id = options['user_id']
        top_n = options['top_n']
        self.stdout.write(f"Generating recommendations for user {user_id}...")

        # Call the recommend_courses function from utils
        recommended_course_ids, status_message = recommend_courses(
            user_id=user_id, top_n=top_n)

        # Print the status message if it exists
        if status_message:
            self.stdout.write(status_message)

        # Check if there are any recommendations
        if len(recommended_course_ids) == 0:
            self.stdout.write("No recommendations available.")
            return

        # Load courses to display details
        courses_df = pd.read_csv('ml_data/courses.csv')
        recommended_courses = courses_df[courses_df['id'].isin(
            recommended_course_ids)]

        self.stdout.write("Recommended courses:")
        for _, course in recommended_courses.iterrows():
            self.stdout.write(
                f"- {course['title']} (Subject: {course['subject']}, Level: {course['level']})")
