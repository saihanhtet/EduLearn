"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { AppSidebar } from "@/components/app-sidebar";
import CourseCard from "@/components/partials/CourseCard";
import Loader from "@/components/partials/Loader";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { IconCaretLeftFilled, IconCaretRightFilled } from "@tabler/icons-react";
import { apiService } from "@/lib/apiService";
import { CourseGetProps, RecommendGetProps } from "@/lib/eventModels";

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
    gridCols = "grid-cols-3",
    showOverlayButtons = false,
    showResultCount = false,
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const totalItems = courses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const visibleCourses = courses.slice(currentIndex, currentIndex + itemsPerPage);

    const handleNext = () => {
        if (currentIndex + itemsPerPage < totalItems) {
            setCurrentIndex(currentIndex + itemsPerPage);
        }
    };

    const handlePrev = () => {
        if (currentIndex - itemsPerPage >= 0) {
            setCurrentIndex(currentIndex - itemsPerPage);
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentIndex((page - 1) * itemsPerPage);
    };

    return (
        <>
            <h1 className="text-base font-semibold">{title}</h1>
            {showResultCount && (
                <p className={`text-md font-semibold pb-3 mt-0 ${totalItems !== 0 ? "text-green-500" : "text-red-500"}`}>
                    Found {totalItems} result{totalItems !== 1 ? "s" : ""}
                </p>
            )}
            <div className="relative">
                <div className={`grid gap-4 ${gridCols}`}>
                    {visibleCourses.map((course) => (
                        <div key={`${course._id}-${course.title}`} >
                            <CourseCard course={course} />
                        </div>
                    ))}
                </div>
                {totalItems > itemsPerPage && (
                    showOverlayButtons ? (
                        <>
                            <Button
                                onClick={handlePrev}
                                disabled={currentIndex === 0}
                                hidden={currentIndex === 0}
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900 text-white opacity-75 hover:opacity-100"
                            >
                                <IconCaretLeftFilled />
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={currentIndex + itemsPerPage >= totalItems}
                                hidden={currentIndex + itemsPerPage >= totalItems}
                                className="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-gray-900 text-white opacity-75 hover:opacity-100"
                            >
                                <IconCaretRightFilled />
                            </Button>
                        </>
                    ) : (
                        <Pagination className="mt-4">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentIndex((prev) => Math.max(prev - itemsPerPage, 0))}
                                        className={currentIndex === 0 ? "pointer-events-none opacity-50" : ""}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <PaginationItem key={i}>
                                        <PaginationLink
                                            onClick={() => handlePageChange(i + 1)}
                                            isActive={currentIndex / itemsPerPage === i}
                                        >
                                            {i + 1}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentIndex((prev) => Math.min(prev + itemsPerPage, totalItems - itemsPerPage))}
                                        className={currentIndex + itemsPerPage >= totalItems ? "pointer-events-none opacity-50" : ""}
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
                <SiteHeader title="Browse Online Courses" is_student={false} />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <div className="px-6">
                                <Input
                                    type="text"
                                    placeholder="Search courses by title, subject, or description..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full max-w-lg"
                                />
                            </div>

                            {isLoading ? (
                                <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                    <Loader />
                                </div>
                            ) : error ? (
                                <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                    <p className="text-red-500 text-center">{error}</p>
                                </div>
                            ) : recommendation.length === 0 && filteredCourses.length === 0 ? (
                                <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                    <p className="text-gray-500 text-center">No courses available.</p>
                                </div>
                            ) : (
                                <div className="p-6 pt-3 space-y-6">
                                    {recommendation.length > 0 && searchQuery.trim() === "" && (
                                        <CourseSection
                                            title="Best Top 8 Courses Recommended for You"
                                            courses={recommendation}
                                            itemsPerPage={3}
                                            showOverlayButtons
                                        />
                                    )}
                                    {(searchQuery.trim() !== "" || filteredCourses.length > 0) && (
                                        <CourseSection
                                            title={searchQuery.trim() !== "" ? "Search Results" : "All Courses"}
                                            courses={filteredCourses}
                                            itemsPerPage={6}
                                            gridCols="sm:grid-cols-2 md:grid-cols-3"
                                            showResultCount={searchQuery.trim() !== ""}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
