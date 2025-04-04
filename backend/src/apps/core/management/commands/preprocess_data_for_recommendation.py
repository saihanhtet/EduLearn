# apps/core/management/commands/preprocess_data_for_recommendation.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Preprocesses data for the recommendation system'

    def handle(self, *args, **options):
        self.stdout.write("Preprocessing data for recommendation system...")

        # Load the data
        users_df = pd.read_csv('ml_data/users.csv')
        courses_df = pd.read_csv('ml_data/courses.csv')
        enrollments_df = pd.read_csv('ml_data/enrollments.csv')
        interactions_df = pd.read_csv('ml_data/interactions.csv')
        progress_df = pd.read_csv('ml_data/progress.csv')

        # --- Collaborative Filtering: Create a user-course interaction matrix ---
        # Combine enrollments, interactions, and progress into a single interaction score
        # 1. Enrollments: Score of 1 for each enrollment
        enrollment_scores = enrollments_df[['user_id', 'course_id']].copy()
        enrollment_scores['score'] = 1.0

        # 2. Interactions: Add scores based on interaction type
        interaction_scores = interactions_df[[
            'user_id', 'course_id', 'interaction_type', 'rating']].copy()
        interaction_scores['score'] = interaction_scores['interaction_type'].map({
            'viewed': 0.5,
            'rated': 1.0,
            'completed': 2.0
        })
        # Add rating to the score (if available, scale rating from 1-5 to 0-1 and add)
        interaction_scores['score'] += interaction_scores['rating'].fillna(
            0) / 5.0

        # 3. Progress: Add progress as a score (scale from 0-100 to 0-1)
        progress_scores = progress_df[[
            'user_id', 'course_id', 'progress']].copy()
        progress_scores['score'] = progress_scores['progress'] / 100.0

        # Combine all scores
        all_scores = pd.concat([
            enrollment_scores[['user_id', 'course_id', 'score']],
            interaction_scores[['user_id', 'course_id', 'score']],
            progress_scores[['user_id', 'course_id', 'score']]
        ])

        # Aggregate scores by user and course (sum the scores)
        user_course_scores = all_scores.groupby(['user_id', 'course_id'])[
            'score'].sum().reset_index()

        # Create a user-course matrix
        user_course_matrix = user_course_scores.pivot(
            index='user_id', columns='course_id', values='score').fillna(0)

        # Save the user-course matrix
        user_course_matrix.to_csv('ml_data/user_course_matrix.csv')
        self.stdout.write(
            "Saved user-course matrix to ml_data/user_course_matrix.csv")

        # --- Content-Based Filtering: Create course features ---
        # Combine course features into a single text field for TF-IDF
        courses_df['combined_features'] = (
            courses_df['title'].fillna('') + ' ' +
            courses_df['subject'].fillna('') + ' ' +
            courses_df['level'].fillna('') + ' ' +
            courses_df['description'].fillna('')
        )

        # Encode categorical features
        label_encoder = LabelEncoder()
        courses_df['subject_encoded'] = label_encoder.fit_transform(
            courses_df['subject'])
        courses_df['level_encoded'] = label_encoder.fit_transform(
            courses_df['level'])

        # Create TF-IDF features for the combined text
        tfidf = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = tfidf.fit_transform(courses_df['combined_features'])

        # Combine TF-IDF features with numerical features (difficulty_score, subject_encoded, level_encoded)
        course_features = np.hstack([
            tfidf_matrix.toarray(),
            courses_df[['difficulty_score',
                        'subject_encoded', 'level_encoded']].values
        ])

        # Compute cosine similarity between courses
        course_similarity = cosine_similarity(course_features)

        # Save course similarity matrix
        course_similarity_df = pd.DataFrame(
            course_similarity, index=courses_df['id'], columns=courses_df['id'])
        course_similarity_df.to_csv('ml_data/course_similarity.csv')
        self.stdout.write(
            "Saved course similarity matrix to ml_data/course_similarity.csv")

        self.stdout.write(self.style.SUCCESS("Data preprocessing completed!"))
