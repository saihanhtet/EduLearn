from django.utils import timezone
from django.core.management.base import BaseCommand
from django.core.exceptions import ObjectDoesNotExist
from apps.users.models import CustomUser
from apps.core.models import Course, Enrollment, UserInteraction, LearningProgress, Chapter, Assignment, AssignmentSubmission
from faker import Faker
import random
from datetime import datetime, timedelta
import os
import json
from pathlib import Path

def find_json_file(file_name, start_path='.'):
    for root, dirs, files in os.walk(start_path):
        if file_name in files:
            return os.path.join(root, file_name)
    return None

class Command(BaseCommand):
    help = 'Seeds the database with realistic users, courses, enrollments, interactions, progress, chapters, assignments, and submissions'

    def handle(self, *args, **options):
        self.faker = Faker()
        self.stdout.write("Seeding database...")

        course_json_path = find_json_file('courses.json', start_path='.')
        user_json_path = find_json_file('users.json', start_path='.')

        if course_json_path:
            with open(course_json_path, 'r') as f:
                course_data = json.load(f)
                self.stdout.write(f"Loaded courses from {course_json_path}")
        else:
            self.stdout.write("courses.json not found.")
            course_data = []

        if user_json_path:
            with open(user_json_path, 'r') as f:
                user_data = json.load(f)
                self.stdout.write(f"Loaded users from {user_json_path}")
        else:
            self.stdout.write("users.json not found.")
            user_data = []

        # Pass user_data to seed_users
        self.seed_users(user_data)
        self.seed_courses(course_data)
        self.seed_enrollments()
        self.seed_interactions()
        self.seed_progress()
        self.seed_chapters()
        self.seed_assignments()
        self.seed_submissions()
        self.stdout.write(self.style.SUCCESS("Database seeding completed!"))

    def seed_users(self, initial_users):
        if not initial_users:
            initial_users = []
        student_interests = ["Math", "Science",
                             "History", "Literature", "Computer Science"]
        # Generate additional fake users
        for _ in range(1, 50):
            first_name = self.faker.first_name()
            last_name = self.faker.last_name()
            username = f"{first_name} {last_name}"
            email = f"{last_name.lower()}@gmail.com"
            preferred_subject = random.choice(student_interests)
            student = {
                "email": email,
                "username": username,
                "password": "pass123",
                "role": "student",
                "first_name": first_name,
                "last_name": last_name,
                "preferred_subject": preferred_subject
            }
            initial_users.append(student)

        for user_data in initial_users:
            # Check if user already exists
            if CustomUser.objects.filter(email=user_data["email"]).exists():
                self.stdout.write(
                    f"User {user_data['email']} already exists, skipping...")
                continue

            try:
                if user_data.get("is_superuser"):
                    user = CustomUser.objects.create_superuser(
                        email=user_data["email"],
                        username=user_data["username"],
                        password=user_data["password"]
                    )
                else:
                    user = CustomUser.objects.create_user(
                        email=user_data["email"],
                        username=user_data["username"],
                        password=user_data["password"],
                        role=user_data.get("role", "student")
                    )
                    user.first_name = user_data.get("first_name", "")
                    user.last_name = user_data.get("last_name", "")
                    if "preferred_subject" in user_data:
                        user.preferred_subject = user_data["preferred_subject"]
                    user.save()  # Save additional fields
                self.stdout.write(
                    f"Created user: {user_data['email']} with role {user_data['role']}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(
                    f"Error creating user {user_data['email']}: {str(e)}"))

    def seed_courses(self, courses):
        teacher_emails = {
            "teacher1@gmail.com": None, "teacher2@gmail.com": None, "teacher3@gmail.com": None,
            "teacher4@gmail.com": None, "teacher5@gmail.com": None
        }
        try:
            for email in teacher_emails.keys():
                teacher_emails[email] = CustomUser.objects.get(email=email)
        except ObjectDoesNotExist:
            self.stdout.write(self.style.ERROR(
                "One or more teachers not found. Please seed users first or check teacher emails in courses.json."))
            return

        courses_to_create = []
        for course_data in courses:
            created_by_teacher = teacher_emails.get(course_data["created_by"])
            if created_by_teacher is None:
                self.stdout.write(self.style.ERROR(
                    f"Invalid teacher email: {course_data['created_by']} for course {course_data['title']}. Skipping..."))
                continue
            course_data["created_by"] = created_by_teacher
            if Course.objects.filter(title=course_data["title"]).exists():
                self.stdout.write(
                    f"Course {course_data['title']} already exists, skipping...")
                continue
            courses_to_create.append(course_data)
            self.stdout.write(
                f"Course {course_data['title']} does not exist, adding to creation list...")

        if courses_to_create:
            Course.objects.bulk_create([Course(**course)
                                       for course in courses_to_create])
            self.stdout.write(
                f"Successfully created {len(courses_to_create)} courses.")

    def seed_enrollments(self):
        students = CustomUser.objects.filter(role="student")
        courses = Course.objects.all()
        if not students or not courses:
            self.stdout.write(self.style.ERROR(
                "Students or courses not found. Please seed users and courses first."))
            return

        for student in students:
            num_enrollments = random.randint(2, 5)
            preferred_courses = list(courses.filter(
                subject=student.preferred_subject))
            other_courses = list(courses.exclude(
                subject=student.preferred_subject))
            num_preferred = min(random.randint(1, 2), len(
                preferred_courses), num_enrollments)
            num_other = num_enrollments - num_preferred
            selected_courses = []
            if num_preferred > 0 and preferred_courses:
                selected_courses.extend(random.sample(
                    preferred_courses, num_preferred))
            if num_other > 0 and other_courses:
                selected_courses.extend(
                    random.sample(other_courses, num_other))

            for course in selected_courses:
                if not Enrollment.objects.filter(user=student, course=course).exists():
                    enrolled_at = self.faker.date_time_between(
                        start_date="-1y", end_date="now")
                    Enrollment.objects.create(
                        user=student, course=course, enrolled_at=enrolled_at)
                    self.stdout.write(
                        f"Created enrollment: {student.username} in {course.title}")

    def seed_interactions(self):
        enrollments = Enrollment.objects.all()
        if not enrollments:
            self.stdout.write(self.style.ERROR(
                "No enrollments found. Please seed enrollments first."))
            return

        interaction_types = ["viewed", "rated", "completed"]
        for enrollment in enrollments:
            num_interactions = random.randint(1, 3)
            selected_interactions = random.sample(
                interaction_types, num_interactions)
            for interaction_type in selected_interactions:
                rating = random.randint(
                    1, 5) if interaction_type == "rated" else None
                timestamp = self.faker.date_time_between_dates(
                    datetime_start=enrollment.enrolled_at, datetime_end=datetime.now())
                if not UserInteraction.objects.filter(
                    user=enrollment.user, course=enrollment.course, interaction_type=interaction_type
                ).exists():
                    UserInteraction.objects.create(
                        user=enrollment.user, course=enrollment.course, interaction_type=interaction_type,
                        rating=rating, timestamp=timestamp
                    )
                    self.stdout.write(
                        f"Created interaction: {enrollment.user.username} {interaction_type} {enrollment.course.title}")

    def seed_progress(self):
        enrollments = Enrollment.objects.all()
        if not enrollments:
            self.stdout.write(self.style.ERROR(
                "No enrollments found. Please seed enrollments first."))
            return

        for enrollment in enrollments:
            has_completed = UserInteraction.objects.filter(
                user=enrollment.user, course=enrollment.course, interaction_type="completed"
            ).exists()
            progress = random.uniform(
                90, 100) if has_completed else random.uniform(0, 90)
            last_accessed = self.faker.date_time_between_dates(
                datetime_start=enrollment.enrolled_at, datetime_end=datetime.now())
            if not LearningProgress.objects.filter(user=enrollment.user, course=enrollment.course).exists():
                LearningProgress.objects.create(
                    user=enrollment.user, course=enrollment.course, progress=progress, last_accessed=last_accessed
                )
                self.stdout.write(
                    f"Created progress: {enrollment.user.username} in {enrollment.course.title} with {progress:.1f}%"
                )

    def seed_chapters(self):
        courses = Course.objects.all()
        if not courses:
            self.stdout.write(self.style.ERROR(
                "No courses found. Please seed courses first."))
            return

        self.stdout.write(
            f"Found {courses.count()} courses to seed chapters for.")
        for course in courses:
            num_chapters = random.randint(3, 6)
            self.stdout.write(
                f"Seeding {num_chapters} chapters for course: {course.title}")
            for i in range(num_chapters):
                title = f"Chapter {i+1}: {self.faker.sentence(nb_words=3)}"
                content_types = ["video", "pdf", "text"]
                chosen_content = random.choice(content_types)
                video = f"/media/chapter_videos/{self.faker.file_name(category='video')}" if chosen_content == "video" else None
                pdf = f"/media/chapter_pdfs/{self.faker.file_name(category='office')}" if chosen_content == "pdf" else None
                text_content = self.faker.paragraph(
                    nb_sentences=5) if chosen_content == "text" else None
                if not Chapter.objects.filter(course=course, order=i+1).exists():
                    Chapter.objects.create(
                        course=course, title=title, order=i+1, description=self.faker.paragraph(nb_sentences=2),
                        video=video, pdf=pdf, text_content=text_content
                    )
                    self.stdout.write(
                        f"Created chapter: {title} for {course.title}")

    def seed_assignments(self):
        chapters = Chapter.objects.all()
        if not chapters:
            self.stdout.write(self.style.ERROR(
                "No chapters found. Please seed chapters first."))
            return

        self.stdout.write(
            f"Found {chapters.count()} chapters to seed assignments for.")
        for chapter in chapters:
            if random.choice([True, False]):  # 50% chance
                title = f"Assignment: {self.faker.sentence(nb_words=3)}"
                due_date_naive = self.faker.date_time_between(
                    start_date="now", end_date="+30d")
                due_date = timezone.make_aware(due_date_naive)
                if not Assignment.objects.filter(chapter=chapter).exists():
                    Assignment.objects.create(
                        chapter=chapter, title=title, description=self.faker.paragraph(
                            nb_sentences=3),
                        max_score=100, due_date=due_date
                    )
                    self.stdout.write(
                        f"Created assignment: {title} for {chapter.title}")
            else:
                self.stdout.write(
                    f"No assignment created for {chapter.title} (random choice)")

    def seed_submissions(self):
        assignments = Assignment.objects.all()
        students = CustomUser.objects.filter(role="student")
        if not assignments or not students:
            self.stdout.write(self.style.ERROR(
                "No assignments or students found. Please seed assignments and users first."))
            return

        self.stdout.write(
            f"Found {assignments.count()} assignments and {students.count()} students to seed submissions for.")
        for assignment in assignments:
            enrolled_students = Enrollment.objects.filter(
                course=assignment.chapter.course).values_list('user', flat=True)
            potential_students = students.filter(id__in=enrolled_students)
            if not potential_students:
                self.stdout.write(self.style.WARNING(
                    f"No enrolled students found for course {assignment.chapter.course.title}, skipping submissions"))
                continue

            num_submissions = random.randint(
                0, min(5, potential_students.count()))
            self.stdout.write(
                f"Seeding {num_submissions} submissions for assignment: {assignment.title}")
            if num_submissions == 0:
                self.stdout.write(
                    f"No submissions created for {assignment.title} (random choice)")
                continue

            selected_students = random.sample(
                list(potential_students), num_submissions)
            for student in selected_students:
                submission_type = random.choice(["file", "text"])
                file = f"/media/assignment_submissions/{self.faker.file_name(category='office')}" if submission_type == "file" else None
                text_submission = self.faker.paragraph(
                    nb_sentences=4) if submission_type == "text" else None
                submitted_at_naive = self.faker.date_time_between_dates(
                    datetime_start=assignment.chapter.created_at,
                    datetime_end=min(
                        timezone.now(), assignment.due_date or timezone.now())
                )
                submitted_at = timezone.make_aware(submitted_at_naive) if not timezone.is_aware(
                    submitted_at_naive) else submitted_at_naive
                score = random.randint(50, 100) if random.choice(
                    [True, False]) else None
                feedback = self.faker.sentence(nb_words=10) if score else None
                graded_at = submitted_at + \
                    timedelta(days=random.randint(1, 5)) if score else None
                if graded_at and not timezone.is_aware(graded_at):
                    graded_at = timezone.make_aware(graded_at)

                if not AssignmentSubmission.objects.filter(assignment=assignment, user=student).exists():
                    AssignmentSubmission.objects.create(
                        assignment=assignment, user=student, file=file, text_submission=text_submission,
                        score=score, feedback=feedback, submitted_at=submitted_at, graded_at=graded_at
                    )
                    self.stdout.write(
                        f"Created submission by {student.username} for {assignment.title}")
