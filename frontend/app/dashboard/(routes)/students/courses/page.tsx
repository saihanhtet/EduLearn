"use client";
import DashboardLayout from "@/app/dashboard/_layout";
import CourseCard from "@/components/partials/CourseCard";
import Loader from "@/components/partials/Loader";
import { apiService } from "@/lib/apiService";
import { CourseGetProps, UserDetail } from "@/lib/eventModels";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Custom error type to match ApiError in apiService.ts
interface ApiError extends Error {
    status: number;
}

interface EnrollmentSchema {
    id: number;
    user: UserDetail;
    course: CourseGetProps;
    enrolled_at: string;
    progress: number;
    completed: boolean;
}

// Map EnrollmentSchema to CourseGetProps
const mapEnrollmentToCourseGetProps = (enrollment: EnrollmentSchema): CourseGetProps => {
    console.log(enrollment.course)
    return {
        ...enrollment.course,
        enrolled_at: enrollment.enrolled_at,
        progress: enrollment.progress,
        completed: enrollment.completed,
    };
};

export default function Page() {
    const [enrolledCourses, setEnrolledCourses] = useState<CourseGetProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchCourses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getAll<EnrollmentSchema>("enrollments");
            const mappedCourses = data.map(mapEnrollmentToCourseGetProps);
            setEnrolledCourses(mappedCourses);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || "Failed to load enrolledCourses";
            setError(errorMessage);
            // Handle errors based on status code
            switch (apiError.status) {
                case 401: // Authentication failed
                    toast.error("Authentication failed. Please log in again.");
                    router.push("/login");
                    break;
                case 403: // Authorization failed
                    toast.error("You do not have permission to access this resource.");
                    break;
                case 404: // Resource not found
                    toast.error("Courses not found.");
                    break;
                case 0: // Network/CORS error
                    toast.error("Network error. Please check your connection or server status.");
                    break;
                default: // Other errors (e.g., 500, or unexpected errors)
                    toast.error(errorMessage);
                    break;
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]); // Add router to dependencies to avoid stale closures

    return (
        <DashboardLayout title="My Courses" isStudent={true}>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        {isLoading ? (
                            <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                <Loader />
                            </div>
                        ) : error ? (
                            <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                <p className="text-red-500 text-center">{error}</p>
                            </div>
                        ) : enrolledCourses.length === 0 ? (
                            <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                <p className="text-gray-500 text-center">No courses has been enrolled.</p>
                            </div>
                        ) : (
                            <div className="p-6 grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                                {enrolledCourses.map((enrolledCourse) => (
                                    <CourseCard key={`${enrolledCourse.id}-${Math.random()}`} course={enrolledCourse} isEnrolled={true} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
