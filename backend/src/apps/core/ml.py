from sklearn.linear_model import LogisticRegression
import numpy as np
from .models import Course
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_maps_and_data():
    courses = Course.objects.all()
    if not courses:
        logger.warning("No courses found in DB, using fallback data")
        return {"subjects": {"Unknown": 0}, "levels": {"Unknown": 0}}, np.array([[0, 0]]), np.array([1])

    unique_subjects = sorted(set(c.subject for c in courses))
    unique_levels = sorted(set(c.level for c in courses))

    subject_map = {subject: idx for idx, subject in enumerate(unique_subjects)}
    level_map = {level: idx for idx, level in enumerate(unique_levels)}

    X = np.array([[subject_map[c.subject], level_map[c.level]]
                 for c in courses])
    y = np.array([c.id for c in courses])

    logger.info(f"Training data prepared: X={X.tolist()}, y={y.tolist()}")
    logger.info(f"Subject map: {subject_map}")
    logger.info(f"Level map: {level_map}")

    return {"subjects": subject_map, "levels": level_map}, X, y


def train_model():
    maps, X, y = get_maps_and_data()
    if len(X) < 2:
        logger.warning("Not enough data (< 2 courses), skipping ML training")
        return None, maps

    model = LogisticRegression()
    model.fit(X, y)
    logger.info("Model trained successfully")
    return model, maps


# Don’t train at import time—initialize as None
trained_model = None
maps = {"subjects": {"Unknown": 0}, "levels": {"Unknown": 0}}


def recommend(subject: str, level: str):
    global trained_model, maps
    subject_map = maps["subjects"]
    level_map = maps["levels"]

    subject_id = subject_map.get(subject, subject_map.get("Unknown", 0))
    level_id = level_map.get(level, level_map.get("Unknown", 0))
    logger.info(
        f"Recommending for subject={subject} ({subject_id}), level={level} ({level_id})")

    if trained_model is None:
        logger.info("No trained model, using DB fallback or training now")
        trained_model, maps = train_model()  # Train on first use if not already trained
        if trained_model is None:  # Still not enough data
            try:
                course = Course.objects.filter(
                    subject=subject, level=level).first()
                if course:
                    return {"message": f"Recommended: {course.title}", "path": [course.title]}
                return {"message": "No course found", "path": []}
            except Course.DoesNotExist:
                return {"message": "No course found", "path": []}

    pred = trained_model.predict([[subject_id, level_id]])
    logger.info(f"Prediction: course ID {pred[0]}")
    try:
        course = Course.objects.get(id=pred[0])
        return {"message": f"Recommended: {course.title}", "path": [course.title]}
    except Course.DoesNotExist:
        return {"message": "No course found", "path": []}


def retrain_model():
    global trained_model, maps
    trained_model, maps = train_model()
    logger.info("Model retrained")
