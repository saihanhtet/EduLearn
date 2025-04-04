# Recommendation Analysis for User 2

This document explains why the recommendation system suggested the following courses for `user_id=2`:

- **Intro to Algebra (Math, Beginner)**
- **Advanced Calculus (Math, Advanced)**
- **Physics 101 (Science, Beginner)**
- **Quantum Mechanics (Science, Advanced)**
- **World History (History, Beginner)** (Note: This was incorrectly included due to a bug, which has been fixed)

The recommendation system uses a hybrid approach combining **collaborative filtering** and **content-based filtering**. We’ll analyze both components based on the provided data to understand why these courses were recommended.

![Recommendation Analysis For User 2](images/Screenshot%202025-03-24%20at%203.02.58 PM.png)

---

## Overview of the Recommendation System

The `recommend_courses()` function in `apps/core/utils/recommendation.py` uses a hybrid approach to generate recommendations:

1. **Collaborative Filtering**:
   - Computes a user-course interaction matrix (`user_course_matrix.csv`) based on enrollments, interactions, and progress.
   - Calculates user similarity using cosine similarity between users based on their interaction scores.
   - Predicts scores for courses based on the preferences of similar users.
2. **Content-Based Filtering**:
   - Uses a course similarity matrix (`course_similarity.csv`) based on course features (title, subject, level, description, etc.).
   - Recommends courses similar to the ones the user has interacted with.
3. **Hybrid Approach**:
   - Combines the collaborative filtering scores (weight: 0.6) and content-based filtering scores (weight: 0.4) to get hybrid scores.
   - Excludes courses the user is already enrolled in.
   - Returns the top N courses with the highest hybrid scores.

---

## Data for User 2

Let’s examine the data for `user_id=2` to understand their interactions and enrollments.

### Users (`ml_data/users.csv`)

![Users](images/Screenshot%202025-03-24%20at%203.04.10 PM.png)
- User 2 is a student.

### Enrollments (`ml_data/enrollments.csv`)

![Image](images/Screenshot%202025-03-24%20at%203.05.26 PM.png)

- User 2 is enrolled in:
  - Course 2: Calculus Basics (Math, Intermediate)
  - Course 6: World History (History, Beginner)

### Interactions (`ml_data/interactions.csv`)

![Image](images/Screenshot%202025-03-24%20at%203.06.14 PM.png)
- User 2 has:
  - Viewed and rated (5.0) Course 2 (Calculus Basics).
  - Completed Course 6 (World History).

### Progress (`ml_data/progress.csv`)

![Image](images/Screenshot%202025-03-24%20at%203.06.50 PM.png)
- User 2 has:
  - 75% progress in Course 2 (Calculus Basics).
  - 100% progress in Course 6 (World History).

### User-Course Matrix (`ml_data/user_course_matrix.csv`)

![Image](images/Screenshot%202025-03-24%20at%203.07.23 PM.png)
- User 2 has:
  - Score of 4.25 for Course 2 (Calculus Basics).
  - Score of 4.0 for Course 6 (World History).
- **Score Calculation for Course 2 (Calculus Basics)**:
  - Enrollment: 1.0
  - Interactions: `viewed` (0.5) + `rated` (1.0) + rating (5.0 / 5 = 1.0) = 2.5
  - Progress: 75.0 / 100 = 0.75
  - Total: 1.0 + 2.5 + 0.75 = 4.25
- **Score Calculation for Course 6 (World History)**:
  - Enrollment: 1.0
  - Interactions: `completed` (2.0)
  - Progress: 100.0 / 100 = 1.0
  - Total: 1.0 + 2.0 + 1.0 = 4.0

### Courses (`ml_data/courses.csv`)

![Image](images/Screenshot%202025-03-24%20at%203.07.52 PM.png)
### Course Similarity Matrix (`ml_data/course_similarity.csv`)

![Image](images/Screenshot%202025-03-24%20at%203.08.53 PM.png)
- This matrix shows the cosine similarity between courses based on their features (title, subject, level, description, etc.).

---

## Collaborative Filtering Analysis

**Collaborative Filtering** looks at the preferences of similar users to recommend courses.

### Compute User Similarity
The user-course matrix is:
| user_id | 1   | 2    | 4   | 6   |
|---------|-----|------|-----|-----|
| 1       | 3.8 | 0.0  | 1.7 | 0.0 |
| 2       | 0.0 | 4.25 | 0.0 | 4.0 |

- User 1 has scores: [3.8, 0.0, 1.7, 0.0] (for courses 1, 2, 4, 6).
- User 2 has scores: [0.0, 4.25, 0.0, 4.0] (for courses 1, 2, 4, 6).

Using cosine similarity:
- Dot product of User 1 and User 2: \( 3.8 \times 0.0 + 0.0 \times 4.25 + 1.7 \times 0.0 + 0.0 \times 4.0 = 0 \).
- Magnitude of User 1’s vector: \( \sqrt{3.8^2 + 0.0^2 + 1.7^2 + 0.0^2} = \sqrt{14.44 + 2.89} = \sqrt{17.33} \approx 4.163 \).
- Magnitude of User 2’s vector: \( \sqrt{0.0^2 + 4.25^2 + 0.0^2 + 4.0^2} = \sqrt{18.0625 + 16.0} = \sqrt{34.0625} \approx 5.836 \).
- Cosine similarity: \( \frac{0}{4.163 \times 5.836} = 0 \).

The similarity between User 1 and User 2 is 0, meaning they have no overlap in their course preferences (User 1 is enrolled in courses 1 and 4, while User 2 is enrolled in courses 2 and 6). Since there are no similar users with positive similarity, the collaborative filtering scores for User 2 are all 0:

- `collab_scores = [0, 0, 0, 0, 0, 0]` (for courses 1, 2, 3, 4, 5, 6).

---

## Content-Based Filtering Analysis

**Content-Based Filtering** recommends courses similar to the ones User 2 has interacted with (courses 2 and 6).

### Identify User 2’s Interacted Courses
User 2 has interacted with:
- Course 2: Calculus Basics (Math, Intermediate)
- Course 6: World History (History, Beginner)

### Compute Content-Based Scores
The content-based scores are calculated by summing the similarity scores of the courses User 2 has interacted with. For each course, we add the similarity scores from the `course_similarity` matrix for courses 2 and 6.

- **Course 2 (Calculus Basics) similarities**:
  ```
  1: 0.8851
  2: 1.0
  3: 0.8159
  4: 0.8484
  5: 0.8014
  6: 0.8433
  ```
- **Course 6 (World History) similarities**:
  ```
  1: 0.7786
  2: 0.8433
  3: 0.7789
  4: 0.7056
  5: 0.7454
  6: 1.0
  ```

Sum the similarities for each course:
- Course 1: \( 0.8851 + 0.7786 = 1.6637 \)
- Course 2: \( 1.0 + 0.8433 = 1.8433 \)
- Course 3: \( 0.8159 + 0.7789 = 1.5948 \)
- Course 4: \( 0.8484 + 0.7056 = 1.5540 \)
- Course 5: \( 0.8014 + 0.7454 = 1.5468 \)
- Course 6: \( 0.8433 + 1.0 = 1.8433 \)

So, the content-based scores are:
- `content_scores = [1.6637, 1.8433, 1.5948, 1.5540, 1.5468, 1.8433]` (for courses 1, 2, 3, 4, 5, 6).

### Normalize Content-Based Scores
Normalize by dividing by the maximum score (1.8433):
- Course 1: \( 1.6637 / 1.8433 \approx 0.9026 \)
- Course 2: \( 1.8433 / 1.8433 = 1.0 \)
- Course 3: \( 1.5948 / 1.8433 \approx 0.8652 \)
- Course 4: \( 1.5540 / 1.8433 \approx 0.8431 \)
- Course 5: \( 1.5468 / 1.8433 \approx 0.8392 \)
- Course 6: \( 1.8433 / 1.8433 = 1.0 \)

Normalized `content_scores = [0.9026, 1.0, 0.8652, 0.8431, 0.8392, 1.0]`.

---

## Hybrid Scores

The hybrid scores are calculated as:
- `hybrid_scores = 0.6 * collab_scores + 0.4 * content_scores`

Since `collab_scores` are all 0 (no similar users), the hybrid scores are:
- `hybrid_scores = 0.6 * [0, 0, 0, 0, 0, 0] + 0.4 * [0.9026, 1.0, 0.8652, 0.8431, 0.8392, 1.0]`
- `hybrid_scores = 0.4 * [0.9026, 1.0, 0.8652, 0.8431, 0.8392, 1.0]`
- `hybrid_scores = [0.3610, 0.4000, 0.3461, 0.3372, 0.3357, 0.4000]`

### Exclude Enrolled Courses
User 2 is enrolled in courses 2 and 6, so we set their scores to -1:
- `hybrid_scores = [0.3610, -1, 0.3461, 0.3372, 0.3357, -1]`

### Get Top Courses
Sort the `hybrid_scores` in descending order:
- Course 1: 0.3610
- Course 3: 0.3461
- Course 4: 0.3372
- Course 5: 0.3357
- Course 2: -1
- Course 6: -1

After fixing a bug in the recommendation logic (to exclude courses with negative scores), the top 4 courses are:
- Course 1 (Intro to Algebra): 0.3610
- Course 3 (Advanced Calculus): 0.3461
- Course 4 (Physics 101): 0.3372
- Course 5 (Quantum Mechanics): 0.3357

The original output included Course 6 (World History) as the 5th recommendation, which was incorrect because User 2 is already enrolled in it. This was due to a bug in the exclusion logic, which has been fixed. After the fix, only 4 courses are recommended because there are only 4 courses with positive scores after excluding courses 2 and 6.

---

## Why These Courses Were Recommended

### Collaborative Filtering Contribution
- The collaborative filtering scores were all 0 because User 2 has no similar users (cosine similarity with User 1 is 0).
- Therefore, the recommendations are entirely driven by the content-based filtering component.

### Content-Based Filtering Contribution
The content-based scores were based on the similarity of other courses to User 2’s interacted courses (2 and 6):
- **Course 2 (Calculus Basics, Math, Intermediate)**: User 2 has a high interaction score (4.25) with this course, indicating strong interest in Math-related topics.
- **Course 6 (World History, History, Beginner)**: User 2 has completed this course (score 4.0), indicating interest in beginner-level courses and possibly History.

The normalized content-based scores (before exclusion) were:
- Course 1 (Intro to Algebra): 0.9026
- Course 3 (Advanced Calculus): 0.8652
- Course 4 (Physics 101): 0.8431
- Course 5 (Quantum Mechanics): 0.8392

#### 1. Intro to Algebra (Math, Beginner)
- **Score**: 0.9026 (highest content-based score).
- **Similarity to Course 2 (Calculus Basics)**: 0.8851 (high because both are Math courses).
- **Similarity to Course 6 (World History)**: 0.7786 (moderate, due to shared beginner-level features).
- **Reason**: User 2’s strong interest in Math (from Course 2) makes this a strong recommendation. The beginner level also aligns with User 2’s preference for beginner courses (e.g., World History).

#### 2. Advanced Calculus (Math, Advanced)
- **Score**: 0.8652 (second-highest content-based score).
- **Similarity to Course 2 (Calculus Basics)**: 0.8159 (high because both are Math courses, and Advanced Calculus is a natural progression from Calculus Basics).
- **Similarity to Course 6 (World History)**: 0.7789 (moderate).
- **Reason**: User 2’s interest in Math makes this a good fit, even though it’s at an advanced level. It’s a natural progression from Calculus Basics.

#### 3. Physics 101 (Science, Beginner)
- **Score**: 0.8431 (third-highest content-based score).
- **Similarity to Course 2 (Calculus Basics)**: 0.8484 (moderate, because calculus and physics are often related, e.g., shared keywords in descriptions).
- **Similarity to Course 6 (World History)**: 0.7056 (lower, but the beginner level aligns with User 2’s preference).
- **Reason**: Introduces a new subject (Science) that complements User 2’s academic interests. The beginner level matches User 2’s preference for beginner courses.

#### 4. Quantum Mechanics (Science, Advanced)
- **Score**: 0.8392 (fourth-highest content-based score).
- **Similarity to Course 2 (Calculus Basics)**: 0.8014 (moderate, due to the mathematical foundation required for physics).
- **Similarity to Course 6 (World History)**: 0.7454 (lower).
- **Reason**: Its relation to Math (via Course 2) makes it a reasonable recommendation, though it might be challenging for User 2 given their preference for beginner-level courses.

#### 5. World History (History, Beginner) - Incorrect Recommendation
- **Reason for Inclusion**: This course was incorrectly included due to a bug in the exclusion logic. User 2 is already enrolled in Course 6 (World History), so its hybrid score was set to -1. However, the original logic for selecting the top 5 courses did not properly exclude courses with negative scores, leading to its inclusion.
- **Fix**: The recommendation logic has been updated to only select courses with positive scores, so this course is no longer recommended.

---

## Why Not Other Courses?

- **Course 2 (Calculus Basics)**: Excluded because User 2 is already enrolled.
- **Course 6 (World History)**: Excluded because User 2 is already enrolled (after fixing the bug).

---

## Recommendations for Improvement

1. **Incorporate User Preferences**:
   - User 2 seems to prefer beginner-level courses (World History is Beginner, and they’ve only completed 75% of Calculus Basics, which is Intermediate). The system could prioritize beginner or intermediate courses over advanced ones like Quantum Mechanics and Advanced Calculus.
   - Add a user preference for difficulty level (e.g., based on their past enrollments) to weight courses accordingly.

2. **Use More User Features**:
   - Incorporate user features like `role` (student vs. teacher) or additional profile data (e.g., preferred subjects) to refine recommendations.

3. **Improve Collaborative Filtering**:
   - With only two users in the dataset, collaborative filtering is ineffective (similarity is 0). As more users are added, this component will become more useful.

4. **Adjust Weights**:
   - The current hybrid weights (0.6 for collaborative, 0.4 for content-based) are not optimal since collaborative filtering contributed nothing. Dynamically adjust weights based on the availability of similar users.

---

## Conclusion

The recommendations for User 2 were driven entirely by content-based filtering due to the lack of similar users for collaborative filtering. The system recommended Math and Science courses because of User 2’s strong interest in Math (via Calculus Basics) and the similarity of these courses to their enrolled courses. The inclusion of World History was a bug, which has been fixed. Future improvements can focus on incorporating user preferences and enhancing collaborative filtering as the user base grows.
