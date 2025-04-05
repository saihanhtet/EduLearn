"use client";

import DashboardLayout from "@/app/dashboard/_layout";
import CourseCard from "@/components/partials/CourseCard";
import Loader from "@/components/partials/Loader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { apiService } from "@/lib/apiService";
import { CourseGetProps, RecommendGetProps } from "@/lib/eventModels";
import { IconCaretLeftFilled, IconCaretRightFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

// Types
interface ApiError extends Error {
    status: number;
}

interface CourseSectionProps {
    title: string;
    courses: CourseGetProps[];
    itemsPerPage: number;
    gridCols?: string;
    showOverlayButtons?: boolean;
    showResultCount?: boolean;
    responsiveItemsPerPage?: boolean; // New prop to control responsive behavior
}

// Custom Hook for Course Data
const useCourses = () => {
    const [recommendation, setRecommendation] = useState<CourseGetProps[]>([]);
    const [allCourses, setAllCourses] = useState<CourseGetProps[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CourseGetProps[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchCourses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [recommendationData, courseData] = await Promise.all([
                apiService.getRecommended<RecommendGetProps>("?top_n=8"),
                apiService.getAll<CourseGetProps>("courses"),
            ]);
            setRecommendation(recommendationData.courses);
            setAllCourses(courseData);
            setFilteredCourses(courseData);
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || "Failed to load courses";
            setError(errorMessage);
            handleApiError(apiError, router);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [router]);

    useEffect(() => {
        const filtered = searchQuery.trim()
            ? allCourses.filter((course) =>
                ["title", "subject", "description"].some((field) =>
                    course[field as keyof CourseGetProps]
                        ?.toString()
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                )
            )
            : allCourses;
        setFilteredCourses(filtered);
    }, [searchQuery, allCourses]);

    return { recommendation, filteredCourses, searchQuery, setSearchQuery, isLoading, error };
};

// Error Handling Utility
const handleApiError = (error: ApiError, router: ReturnType<typeof useRouter>) => {
    switch (error.status) {
        case 401:
            toast.error("Authentication failed. Please log in again.");
            router.push("/login");
            break;
        case 403:
            toast.error("You do not have permission to access this resource.");
            break;
        case 404:
            toast.error("Courses not found.");
            break;
        case 0:
            toast.error("Network error. Please check your connection or server status.");
            break;
        default:
            toast.error(error.message || "An unexpected error occurred.");
    }
};

// Reusable Course Section Component
const CourseSection: React.FC<CourseSectionProps> = ({
    title,
    courses,
    itemsPerPage,
    gridCols = "grid-cols-1 md:grid-cols-3",
    showOverlayButtons = false,
    showResultCount = false,
    responsiveItemsPerPage = false, // Default to false
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile screen size only if responsiveItemsPerPage is true
    useEffect(() => {
        if (responsiveItemsPerPage) {
            const mediaQuery = window.matchMedia('(max-width: 767px)'); // md breakpoint
            setIsMobile(mediaQuery.matches);

            const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [responsiveItemsPerPage]);

    const effectiveItemsPerPage = responsiveItemsPerPage && isMobile ? 1 : itemsPerPage; // 1 on mobile if responsive, otherwise use passed value
    const totalItems = courses.length;
    const totalPages = Math.ceil(totalItems / effectiveItemsPerPage);
    const visibleCourses = courses.slice(currentIndex, currentIndex + effectiveItemsPerPage);

    const handleNext = () => {
        if (currentIndex + effectiveItemsPerPage < totalItems) {
            setCurrentIndex(currentIndex + effectiveItemsPerPage);
        }
    };

    const handlePrev = () => {
        if (currentIndex - effectiveItemsPerPage >= 0) {
            setCurrentIndex(currentIndex - effectiveItemsPerPage);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentIndex((page - 1) * effectiveItemsPerPage);
    };

    return (
        <>
            <h1 className="text-base font-semibold dark:text-white">{title}</h1>
            {showResultCount && (
                <p className={`text-md font-semibold pb-3 mt-0 ${totalItems !== 0 ? "text-green-500 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                    Found {totalItems} result{totalItems !== 1 ? "s" : ""}
                </p>
            )}
            <div className="relative">
                <div className={`grid gap-4 ${gridCols}`}>
                    {visibleCourses.map((course) => (
                        <div key={`${course.id}`}>
                            <CourseCard course={course} />
                        </div>
                    ))}
                </div>
                {totalItems > effectiveItemsPerPage && (
                    showOverlayButtons ? (
                        <>
                            <Button
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                hidden={currentIndex === 0}
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-200 opacity-75 hover:opacity-100 dark:hover:bg-gray-700"
                            >
                                <IconCaretLeftFilled />
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={currentIndex + effectiveItemsPerPage >= totalItems}
                                hidden={currentIndex + effectiveItemsPerPage >= totalItems}
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-200 opacity-75 hover:opacity-100 dark:hover:bg-gray-700"
                            >
                                <IconCaretRightFilled />
                            </Button>
                        </>
                    ) : (
                        <Pagination className="mt-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentIndex((prev) => Math.max(prev - effectiveItemsPerPage, 0))}
                                        className={currentIndex === 0 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            onClick={() => handlePageChange(i + 1)}
                                            isActive={currentIndex / effectiveItemsPerPage === i}
                                            className="dark:text-white dark:hover:bg-gray-700"
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentIndex((prev) => Math.min(prev + effectiveItemsPerPage, totalItems - effectiveItemsPerPage))}
                                        className={currentIndex + effectiveItemsPerPage >= totalItems ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )
                )}
            </div>
        </>
    );
};

// Main Page Component
export default function CoursesPage() {
    const { recommendation, filteredCourses, searchQuery, setSearchQuery, isLoading, error } = useCourses();

    return (
        <DashboardLayout title="Browse Online Courses" isStudent={true}>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        <div className="px-6">
                            <Input
                                type="text"
                                placeholder="Search courses by title, subject, or description..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full max-w-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                            />
                        </div>

                        {isLoading ? (
                            <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                <Loader />
                            </div>
                        ) : error ? (
                            <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
                            </div>
                        ) : recommendation.length === 0 && filteredCourses.length === 0 ? (
                            <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                <p className="text-gray-500 dark:text-gray-300 text-center">No courses available.</p>
                            </div>
                        ) : (
                            <div className="p-6 pt-3 space-y-6">
                                {recommendation.length > 0 && searchQuery.trim() === "" && (
                                    <CourseSection
                                        title="Best Top 8 Courses Recommended for You"
                                        courses={recommendation}
                                        itemsPerPage={3} // 1 on mobile, 3 on desktop
                                        gridCols="grid-cols-1 md:grid-cols-3"
                                        showOverlayButtons
                                        responsiveItemsPerPage={true} // Enable responsive behavior
                                    />
                                )}
                                {(searchQuery.trim() !== "" || filteredCourses.length > 0) && (
                                    <CourseSection
                                        title={searchQuery.trim() !== "" ? "Search Results" : "All Courses"}
                                        courses={filteredCourses}
                                        itemsPerPage={10} // 10 on all screen sizes
                                        gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                                        showResultCount={searchQuery.trim() !== ""}
                                        responsiveItemsPerPage={false} // Disable responsive behavior
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
