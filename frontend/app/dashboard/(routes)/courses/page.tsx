"use client";
import { AppSidebar } from "@/components/app-sidebar";
import CourseCard from "@/components/partials/CourseCard";
import Loader from "@/components/partials/Loader";
import { SiteHeader } from "@/components/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { apiService } from "@/lib/apiService"; // No need for API_BASE_URL since getAll constructs the URL
import { EnrollmentGetProps } from "@/lib/eventModels";
import { useRouter } from "next/navigation"; // Add useRouter for navigation
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Custom error type to match ApiError in apiService.ts
interface ApiError extends Error {
    status: number;
}

export default function Page() {
    const [enrolledCourses, setEnrolledCourses] = useState<EnrollmentGetProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchCourses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getAll<EnrollmentGetProps>("enrollments");
            setEnrolledCourses(data);
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
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader title="Courses" is_student={false} />
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
                                        <CourseCard key={`${enrolledCourse.id}-${enrolledCourse.course.title}`} course={enrolledCourse.course} />
                                    ))}
                                </div>
                            )}
                            {/* Remove the unconditional Loader; it's already handled above */}
                            {/* <Loader isLoading={true} /> */}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
