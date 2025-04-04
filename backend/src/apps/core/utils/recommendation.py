# apps/core/utils/recommendation.py
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import Optional, List, Tuple

from apps.core.models import Course, Enrollment


def recommend_courses(user_id: int, top_n: int = 3, subject: Optional[str] = None, level: Optional[str] = None) -> Tuple[List[int], Optional[str]]:
    # Load the preprocessed data
    user_course_matrix = pd.read_csv(
        'ml_data/user_course_matrix.csv', index_col='user_id')
    course_similarity = pd.read_csv(
        'ml_data/course_similarity.csv', index_col=0)
    courses_df = pd.read_csv('ml_data/courses.csv')

    # Check if the user exists in the user-course matrix
    if user_id not in user_course_matrix.index:
        status_message = f"User {user_id} has no interactions. Using default recommendations."
        # Fetch default courses based on subject and level (if provided)
        default_courses = Course.objects.all()
        if subject:
            default_courses = default_courses.filter(subject=subject)
        if level:
            default_courses = default_courses.filter(level=level)
        else:
            # If level is not provided, default to Beginner for new users
            default_courses = default_courses.filter(level="Beginner")
        default_course_ids = default_courses.values_list("id", flat=True)[
            :top_n]
        return list(default_course_ids), status_message

    # Ensure course_id columns are integers
    user_course_matrix.columns = user_course_matrix.columns.astype(int)
    course_similarity.index = course_similarity.index.astype(int)
    course_similarity.columns = course_similarity.columns.astype(int)

    # --- Collaborative Filtering ---
    # Compute user similarity based on the user-course matrix
    user_similarity = cosine_similarity(user_course_matrix)
    user_similarity_df = pd.DataFrame(
        user_similarity, index=user_course_matrix.index, columns=user_course_matrix.index)

    status_message = None
    # Compute collaborative filtering scores
    collab_scores = np.zeros(len(courses_df))
    # Get similar users
    similar_users = user_similarity_df[user_id].sort_values(
        ascending=False)[1:]  # Exclude the user itself
    # Only consider users with positive similarity
    similar_users = similar_users[similar_users > 0]

    for similar_user_id, similarity in similar_users.items():
        user_scores = user_course_matrix.loc[similar_user_id].values
        collab_scores += similarity * user_scores

    # Normalize scores
    if collab_scores.max() > 0:
        collab_scores = collab_scores / collab_scores.max()

    # --- Content-Based Filtering ---
    # Get the courses the user has interacted with
    user_courses = user_course_matrix.loc[user_id]
    user_courses = user_courses[user_courses > 0].index
    content_scores = np.zeros(len(courses_df))

    if len(user_courses) > 0:
        # Compute content-based scores based on course similarity
        for course_id in user_courses:
            if course_id in course_similarity.columns:
                content_scores += course_similarity[course_id].values
            else:
                # If the course_id is not in course_similarity, skip it
                continue

        # Normalize scores
        if content_scores.max() > 0:
            content_scores = content_scores / content_scores.max()
    else:
        status_message = f"User {user_id} has no course interactions. Using default recommendations."
        # Fetch default courses based on subject and level (if provided)
        default_courses = Course.objects.all()
        if subject:
            default_courses = default_courses.filter(subject=subject)
        if level:
            default_courses = default_courses.filter(level=level)
        else:
            # If level is not provided, default to Beginner for users with no interactions
            default_courses = default_courses.filter(level="Beginner")
        default_course_ids = default_courses.values_list("id", flat=True)[
            :top_n]
        return list(default_course_ids), status_message

    # --- Combine Scores ---
    # Hybrid approach: weighted combination of collaborative and content-based scores
    hybrid_scores = 0.6 * collab_scores + 0.4 * content_scores

    # Filter courses by subject and level (if provided)
    filtered_course_ids = set(courses_df['id'])
    if subject or level:
        filtered_courses = Course.objects.all()
        if subject:
            filtered_courses = filtered_courses.filter(subject=subject)
        if level:
            filtered_courses = filtered_courses.filter(level=level)
        filtered_course_ids = set(
            filtered_courses.values_list("id", flat=True))

    # Exclude courses the user is already enrolled in using the Enrollment model
    enrolled_course_ids = Enrollment.objects.filter(
        user_id=user_id).values_list("course_id", flat=True)
    course_id_to_index = {course_id: idx for idx,
                          course_id in enumerate(courses_df['id'])}
    enrolled_indices = [course_id_to_index[course_id]
                        for course_id in enrolled_course_ids if course_id in course_id_to_index]
    # Set scores of enrolled courses to -1
    hybrid_scores[enrolled_indices] = -1

    # Apply subject and level filtering to the scores
    for idx, course_id in enumerate(courses_df['id']):
        if course_id not in filtered_course_ids:
            # Exclude courses that don't match the subject/level
            hybrid_scores[idx] = -1

    # Get top N recommendations (only include courses with positive scores)
    # Indices of courses with positive scores
    valid_indices = np.where(hybrid_scores > 0)[0]
    if len(valid_indices) == 0:
        status_message = "No recommendations available after applying filters and excluding enrolled courses."
        # Fetch default courses based on subject and level (if provided)
        default_courses = Course.objects.all()
        if subject:
            default_courses = default_courses.filter(subject=subject)
        if level:
            default_courses = default_courses.filter(level=level)
        else:
            default_courses = default_courses.filter(level="Beginner")
        default_course_ids = default_courses.values_list("id", flat=True)[
            :top_n]
        return list(default_course_ids), status_message

    # Sort valid indices by their scores
    sorted_valid_indices = valid_indices[np.argsort(
        hybrid_scores[valid_indices])[::-1]]
    # Take up to top_n courses (or fewer if not enough valid courses)
    top_indices = sorted_valid_indices[:min(top_n, len(sorted_valid_indices))]
    recommended_course_ids = courses_df.iloc[top_indices]['id'].values

    return list(recommended_course_ids), status_message
