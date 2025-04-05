"use client";

import DashboardLayout from "@/app/dashboard/_layout";
import CourseCard from "@/components/partials/CourseCard";
import Loader from "@/components/partials/Loader";
import { apiService } from "@/lib/apiService";
import { CourseGetProps, EnrollmentSchema } from "@/lib/eventModels";
import { useEffect, useState } from "react";

const mapEnrollmentToCourseGetProps = (enrollment: EnrollmentSchema): CourseGetProps => {
    return {
        ...enrollment.course,
        enrolled_at: enrollment.enrolled_at,
        progress: enrollment.progress,
        completed: enrollment.completed,
    };
};

export default function EnrolledCoursesPage() {
    const [enrolledCourses, setEnrolledCourses] = useState<CourseGetProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPageLoaded, setIsPageLoaded] = useState(false);

    // Trigger fetching after page load
    useEffect(() => {
        setIsPageLoaded(true); // Mark page as loaded
    }, []);

    useEffect(() => {
        if (!isPageLoaded) return; // Wait until page is loaded

        const fetchEnrolledCourses = async () => {
            setIsLoading(true);
            setError(null);

        try {
            const data = await apiService.getAll<EnrollmentSchema>("enrollments");
            const mappedCourses = data.map(mapEnrollmentToCourseGetProps);
            setEnrolledCourses(mappedCourses);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load enrolled courses";
            setError(errorMessage);
            console.error("Error fetching enrolled courses:", err);
        } finally {
            setIsLoading(false);
        }
    };

        fetchEnrolledCourses();
    }, [isPageLoaded]);

    return (
        <DashboardLayout title="My Courses" isStudent={true}>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        {isLoading ? (
                            <div className="flex h-[80vh] w-[70vw] justify-center items-center">
                                <Loader />
                            </div>
                        ) : error ? (
                                <div className="flex h-[80vh] w-[70vw] justify-center items-center">
                                    <p className="text-red-500 text-center">{error}</p>
                                </div>
                            ) : enrolledCourses.length === 0 ? (
                                    <div className="flex h-[80vh] w-[70vw] justify-center items-center">
                                        <p className="text-gray-500 text-center">
                                            {isPageLoaded ? "No courses have been enrolled." : "Loading enrolled courses..."}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-6 grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                                        {enrolledCourses.map((enrolledCourse) => (
                                            <CourseCard
                                                key={`${enrolledCourse.id}-${Math.random()}`}
                                                course={enrolledCourse}
                                                isEnrolled={true}
                                            />
                                        ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
