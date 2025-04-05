// types.ts
export interface CourseSectionProps {
    title: string;
    courses: CourseGetProps[];
    itemsPerPage: number;
    gridCols?: string;
    showOverlayButtons?: boolean;
    showResultCount?: boolean;
    responsiveItemsPerPage?: boolean;
}
export interface EnrollmentSchema {
    id: number;
    user: UserDetail;
    course: CourseGetProps;
    enrolled_at: string;
    progress: number;
    completed: boolean;
}
export interface ApiError extends Error {
    status: number;
}

export interface UseApiDataProps<T> {
    endpoint: string;
    mapData?: (data: EnrollmentSchema[]) => T[];
}

export interface CourseGetProps {
    id: number;
    title: string;
    subject: string;
    level: string;
    difficulty_score: number;
    description: string;
    price?: number;
    image?: string;
    status?: string;
    created_by: {
        id: number;
        email: string;
        username: string;
        role: string;
    };
    created_at: string;
    updated_at: string;
    enrolled_at?: string; // From EnrollmentSchema
    progress?: number; // From EnrollmentSchema (LearningProgress)
    completed?: boolean; // From EnrollmentSchema (UserInteraction)
}

export interface UserDetail {
    id: number;
    email: string;
    username: string;
    role: "student" | "teacher" | "admin";
    preferred_subject?: string;
    profile: {
        bio?: string;
        website?: string;
        gender?: "Male" | "Female" | "Other";
        date_of_birth?: string;
        phone_number?: string;
        account_status: "Active" | "Inactive" | "Suspended";
        joined_date: string;
    };
}


export interface RegisterResponse {
    id: number;
    email: string;
    username: string;
    role: string;
}

export interface EnrollmentGetProps {
    id: number;
    user: RegisterResponse;
    course: CourseGetProps;
    enrolled_at: string;
}

export interface ProgressGetProps {
    id: number;
    user: UserDetail;
    course: CourseGetProps;
    progress: number;
    last_accessed: string
}

export interface RecommendGetProps {
    message: string;
    courses: CourseGetProps[];
}

export interface LoginResponse {
    email: string;
    access: string;
    refresh?: string;
}



export interface CourseCreateUpdateProps {
    title: string;
    subject?: string;
    level?: string;
    status?: string;
    difficulty_score?: number;
    description?: string;
    price?: number;
    image?: string;
}

// User interfaces
export interface UserGetProps {
    id: number;
    email: string;
    username: string;
    role: string;
}

export interface UserCreateUpdateProps {
    email: string;
    username: string;
    password: string;
    role: string;
}

export interface ApiError {
    message: string;
    status: number;
}
