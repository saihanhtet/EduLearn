# coreBackend/management/commands/seed_data.py
from django.core.management.base import BaseCommand
from django.core.exceptions import ObjectDoesNotExist
from apps.users.models import CustomUser
from apps.core.models import Course, Enrollment, UserInteraction, LearningProgress
from faker import Faker
import random
from datetime import datetime, timedelta


class Command(BaseCommand):
    help = 'Seeds the database with realistic users, courses, enrollments, interactions, and progress'

    def handle(self, *args, **options):
        self.faker = Faker()  # Initialize Faker for generating realistic data
        self.stdout.write("Seeding database...")
        self.seed_users()
        self.seed_courses()
        self.seed_enrollments()
        self.seed_interactions()
        self.seed_progress()
        self.stdout.write(self.style.SUCCESS("Database seeding completed!"))

    def seed_users(self):
        # Seed initial admin and teachers with realistic names
        initial_users = [
            {"email": "admin@example.com", "username": "admin", "password": "pass123",
             "role": "admin", "is_superuser": True, "is_staff": True},
            {"email": "teacher1@example.com", "username": "jdoe", "password": "pass123",
             "role": "teacher", "first_name": "John", "last_name": "Doe"},
            {"email": "teacher2@example.com", "username": "asmith", "password": "pass123",
             "role": "teacher", "first_name": "Alice", "last_name": "Smith"},
            {"email": "teacher3@example.com", "username": "mjones", "password": "pass123",
             "role": "teacher", "first_name": "Michael", "last_name": "Jones"},
            {"email": "teacher4@example.com", "username": "lwilliams", "password": "pass123",
             "role": "teacher", "first_name": "Laura", "last_name": "Williams"},
            {"email": "teacher5@example.com", "username": "rbrown", "password": "pass123",
             "role": "teacher", "first_name": "Robert", "last_name": "Brown"},
        ]

        # Seed 100 students with realistic names and emails
        student_interests = ["Math", "Science",
                             "History", "Literature", "Computer Science"]
        for i in range(1, 50):
            first_name = self.faker.first_name()
            last_name = self.faker.last_name()
            username = self.faker.user_name()
            email = self.faker.unique.email()
            # Assign a preferred subject to each student for more realistic enrollments
            preferred_subject = random.choice(student_interests)
            student = {
                "email": email,
                "username": username,
                "password": "pass123",
                "role": "student",
                "first_name": first_name,
                "last_name": last_name,
                # Custom field (you may need to add this to CustomUser model)
                "preferred_subject": preferred_subject
            }
            initial_users.append(student)

        for user_data in initial_users:
            try:
                CustomUser.objects.get(email=user_data["email"])
                self.stdout.write(
                    f"User {user_data['email']} already exists, skipping...")
            except ObjectDoesNotExist:
                if user_data.get("is_superuser"):
                    CustomUser.objects.create_superuser(
                        email=user_data["email"],
                        username=user_data["username"],
                        password=user_data["password"],
                    )
                else:
                    user = CustomUser.objects.create_user(
                        email=user_data["email"],
                        username=user_data["username"],
                        password=user_data["password"],
                        role=user_data["role"],
                    )
                    # Set additional fields
                    user.first_name = user_data.get("first_name", "")
                    user.last_name = user_data.get("last_name", "")
                    if "preferred_subject" in user_data:
                        user.preferred_subject = user_data["preferred_subject"]
                    user.save()
                self.stdout.write(
                    f"Created user: {user_data['email']} with role {user_data['role']}")

    def seed_courses(self):
        # Fetch teachers to assign as course creators
        try:
            teacher1 = CustomUser.objects.get(email="teacher1@example.com")
            teacher2 = CustomUser.objects.get(email="teacher2@example.com")
            teacher3 = CustomUser.objects.get(email="teacher3@example.com")
            teacher4 = CustomUser.objects.get(email="teacher4@example.com")
            teacher5 = CustomUser.objects.get(email="teacher5@example.com")
        except ObjectDoesNotExist:
            self.stdout.write(self.style.ERROR(
                "Teachers not found. Please seed users first."))
            return

        # Expanded list of courses across various subjects and levels
        courses = [
            # Math Courses
            {"title": "Intro to Algebra", "subject": "Math", "level": "Beginner",
             "difficulty_score": 2.0, "description": "Basic algebra concepts", "created_by": teacher1},
            {"title": "Calculus Basics", "subject": "Math", "level": "Intermediate",
             "difficulty_score": 3.0, "description": "Introduction to calculus", "created_by": teacher1},
            {"title": "Advanced Calculus", "subject": "Math", "level": "Advanced",
             "difficulty_score": 4.5, "description": "Advanced calculus topics", "created_by": teacher1},
            {"title": "Linear Algebra", "subject": "Math", "level": "Intermediate",
             "difficulty_score": 3.5, "description": "Fundamentals of linear algebra", "created_by": teacher1},
            {"title": "Statistics 101", "subject": "Math", "level": "Beginner",
             "difficulty_score": 2.5, "description": "Introduction to statistics", "created_by": teacher1},
            {"title": "Probability Theory", "subject": "Math", "level": "Advanced",
             "difficulty_score": 4.0, "description": "Advanced probability concepts", "created_by": teacher1},

            # Science Courses
            {"title": "Physics 101", "subject": "Science", "level": "Beginner",
             "difficulty_score": 2.5, "description": "Basic physics principles", "created_by": teacher2},
            {"title": "Quantum Mechanics", "subject": "Science", "level": "Advanced",
             "difficulty_score": 5.0, "description": "Advanced physics topics", "created_by": teacher2},
            {"title": "Chemistry Basics", "subject": "Science", "level": "Beginner",
             "difficulty_score": 2.0, "description": "Introduction to chemistry", "created_by": teacher2},
            {"title": "Organic Chemistry", "subject": "Science", "level": "Intermediate",
             "difficulty_score": 3.5, "description": "Fundamentals of organic chemistry", "created_by": teacher2},
            {"title": "Biology 101", "subject": "Science", "level": "Beginner",
             "difficulty_score": 2.0, "description": "Introduction to biology", "created_by": teacher2},
            {"title": "Genetics", "subject": "Science", "level": "Advanced",
             "difficulty_score": 4.5, "description": "Advanced topics in genetics", "created_by": teacher2},

            # History Courses
            {"title": "World History", "subject": "History", "level": "Beginner",
             "difficulty_score": 2.0, "description": "Overview of world history", "created_by": teacher3},
            {"title": "Ancient Civilizations", "subject": "History", "level": "Intermediate",
             "difficulty_score": 3.0, "description": "Study of ancient civilizations", "created_by": teacher3},
            {"title": "Modern History", "subject": "History", "level": "Advanced",
             "difficulty_score": 4.0, "description": "Modern historical events", "created_by": teacher3},
            {"title": "European History", "subject": "History", "level": "Intermediate",
             "difficulty_score": 3.0, "description": "History of Europe", "created_by": teacher3},

            # Literature Courses
            {"title": "Intro to Literature", "subject": "Literature", "level": "Beginner",
             "difficulty_score": 2.0, "description": "Introduction to literary studies", "created_by": teacher4},
            {"title": "Shakespeare Studies", "subject": "Literature", "level": "Intermediate",
             "difficulty_score": 3.5, "description": "Works of Shakespeare", "created_by": teacher4},
            {"title": "Modern Poetry", "subject": "Literature", "level": "Advanced",
             "difficulty_score": 4.0, "description": "Analysis of modern poetry", "created_by": teacher4},
            {"title": "American Literature", "subject": "Literature", "level": "Intermediate",
             "difficulty_score": 3.0, "description": "American literary works", "created_by": teacher4},

            # Computer Science Courses
            {"title": "Intro to Programming", "subject": "Computer Science", "level": "Beginner",
             "difficulty_score": 2.5, "description": "Basics of programming", "created_by": teacher5},
            {"title": "Data Structures", "subject": "Computer Science", "level": "Intermediate",
             "difficulty_score": 3.5, "description": "Fundamentals of data structures", "created_by": teacher5},
            {"title": "Machine Learning", "subject": "Computer Science", "level": "Advanced",
             "difficulty_score": 5.0, "description": "Introduction to machine learning", "created_by": teacher5},
            {"title": "Algorithms", "subject": "Computer Science", "level": "Intermediate",
             "difficulty_score": 4.0, "description": "Study of algorithms", "created_by": teacher5},
        ]

        for course_data in courses:
            try:
                Course.objects.get(title=course_data["title"])
                self.stdout.write(
                    f"Course {course_data['title']} already exists, skipping...")
            except ObjectDoesNotExist:
                Course.objects.create(**course_data)
                self.stdout.write(f"Created course: {course_data['title']}")

    def seed_enrollments(self):
        # Fetch all students and courses
        students = CustomUser.objects.filter(role="student")
        courses = Course.objects.all()

        if not students or not courses:
            self.stdout.write(self.style.ERROR(
                "Students or courses not found. Please seed users and courses first."))
            return

        # Each student enrolls in 2-5 courses, with a preference for their preferred subject
        for student in students:
            num_enrollments = random.randint(2, 5)
            # Get courses in the student's preferred subject
            preferred_courses = list(courses.filter(
                subject=student.preferred_subject))
            other_courses = list(courses.exclude(
                subject=student.preferred_subject))

            # Ensure at least 1-2 courses are from the preferred subject (if available)
            num_preferred = min(random.randint(1, 2), len(
                preferred_courses), num_enrollments)
            num_other = num_enrollments - num_preferred

            # Select preferred courses
            selected_courses = []
            if num_preferred > 0 and preferred_courses:
                selected_courses.extend(random.sample(
                    preferred_courses, num_preferred))

            # Select other courses
            if num_other > 0 and other_courses:
                selected_courses.extend(
                    random.sample(other_courses, num_other))

            for course in selected_courses:
                try:
                    Enrollment.objects.get(user=student, course=course)
                    self.stdout.write(
                        f"Enrollment for {student.username} in {course.title} already exists, skipping...")
                except ObjectDoesNotExist:
                    # Add a realistic enrollment date (within the last year)
                    enrolled_at = self.faker.date_time_between(
                        start_date="-1y", end_date="now")
                    Enrollment.objects.create(
                        user=student, course=course, enrolled_at=enrolled_at)
                    self.stdout.write(
                        f"Created enrollment: {student.username} in {course.title}")

    def seed_interactions(self):
        # Fetch all enrollments
        enrollments = Enrollment.objects.all()

        if not enrollments:
            self.stdout.write(self.style.ERROR(
                "No enrollments found. Please seed enrollments first."))
            return

        interaction_types = ["viewed", "rated", "completed"]
        for enrollment in enrollments:
            # Each enrollment has 1-3 interactions
            num_interactions = random.randint(1, 3)
            selected_interactions = random.sample(
                interaction_types, num_interactions)
            for interaction_type in selected_interactions:
                rating = random.randint(
                    1, 5) if interaction_type == "rated" else None
                # Add a realistic timestamp (after the enrollment date)
                timestamp = self.faker.date_time_between_dates(
                    datetime_start=enrollment.enrolled_at,
                    datetime_end=datetime.now()
                )
                try:
                    UserInteraction.objects.get(
                        user=enrollment.user,
                        course=enrollment.course,
                        interaction_type=interaction_type
                    )
                    self.stdout.write(
                        f"Interaction {interaction_type} by {enrollment.user.username} for {enrollment.course.title} already exists, skipping...")
                except ObjectDoesNotExist:
                    UserInteraction.objects.create(
                        user=enrollment.user,
                        course=enrollment.course,
                        interaction_type=interaction_type,
                        rating=rating,
                        timestamp=timestamp
                    )
                    self.stdout.write(
                        f"Created interaction: {enrollment.user.username} {interaction_type} {enrollment.course.title}")

    def seed_progress(self):
        # Fetch all enrollments
        enrollments = Enrollment.objects.all()

        if not enrollments:
            self.stdout.write(self.style.ERROR(
                "No enrollments found. Please seed enrollments first."))
            return

        for enrollment in enrollments:
            # Progress is more realistic: higher progress for completed courses
            has_completed = UserInteraction.objects.filter(
                user=enrollment.user,
                course=enrollment.course,
                interaction_type="completed"
            ).exists()
            if has_completed:
                # High progress for completed courses
                progress = random.uniform(90, 100)
            else:
                # Lower progress for non-completed courses
                progress = random.uniform(0, 90)

            # Add a realistic last_accessed date (after the enrollment date)
            last_accessed = self.faker.date_time_between_dates(
                datetime_start=enrollment.enrolled_at,
                datetime_end=datetime.now()
            )
            try:
                LearningProgress.objects.get(
                    user=enrollment.user, course=enrollment.course)
                self.stdout.write(
                    f"Progress for {enrollment.user.username} in {enrollment.course.title} already exists, skipping...")
            except ObjectDoesNotExist:
                LearningProgress.objects.create(
                    user=enrollment.user,
                    course=enrollment.course,
                    progress=progress,
                    last_accessed=last_accessed
                )
                self.stdout.write(
                    f"Created progress: {enrollment.user.username} in {enrollment.course.title} with {progress:.1f}%")
