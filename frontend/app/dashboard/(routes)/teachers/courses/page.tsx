"use client";
import { Button } from "@/components/ui/button";
import { ApiError, CourseGetProps } from "@/lib/eventModels";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import toast from "react-hot-toast";
import { formatTimestamp } from "@/lib/utils";
import { apiService } from "@/lib/apiService";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/app/dashboard/_layout";

const CoursePage = () => {
    const [courses, setCourses] = useState<CourseGetProps[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10); // Fixed at 10 items per page
    const router = useRouter();

    const deleteCourse = async (id: number) => {
        setIsLoading(true);
        try {
            // Use the delete method from apiService
            await apiService.delete("courses", id);
            toast.success("Course deleted successfully");
            // Refresh the course list after deletion
            await fetchCourses();
        } catch (err) {
            const apiError = err as ApiError;
            const errorMessage = apiError.message || "Failed to delete course";
            setError(errorMessage);
            handleApiError(apiError, router);
        } finally {
            setIsLoading(false);
        }
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
                toast.error("Course not found.");
                break;
            case 0:
                toast.error("Network error. Please check your connection or server status.");
                break;
            default:
                toast.error(error.message || "An unexpected error occurred.");
        }
    };

    const fetchCourses = async () => {
        setIsLoading(true);
        try {
            const data = await apiService.getAll<CourseGetProps>("courses");
            setCourses(data);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Pagination Logic
    const totalItems = courses.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const visibleCourses = courses.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    return (
        <DashboardLayout title="All Courses" isStudent={false}>
            <div className="p-6 space-y-2">
                <div className="w-full flex justify-end items-center">
                    <Link href={"/dashboard/teachers/create"}>
                        <Button variant={"outline"}>Create Course</Button>
                    </Link>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Courses</CardTitle>
                        <CardDescription>
                            Manage your courses and view their sales performance.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Price</TableHead>
                                    <TableHead className="hidden md:table-cell">Total Sales</TableHead>
                                    <TableHead className="hidden md:table-cell">Created at</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Actions</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">
                                            Loading...
                                        </TableCell>
                                    </TableRow>
                                ) : error ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-red-500 dark:text-red-400">
                                            {error}
                                        </TableCell>
                                    </TableRow>
                                ) : visibleCourses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">
                                            No courses available.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    visibleCourses.map((course) => (
                                        <TableRow key={course.id}>
                                            <TableCell className="font-medium dark:text-white">{course.title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">Draft</Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell dark:text-white">
                                                ${course?.price || 0}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell dark:text-white">25</TableCell>
                                            <TableCell className="hidden md:table-cell dark:text-white">
                                                {formatTimestamp(course?.created_at) || null}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            aria-haspopup="true"
                                                            size="icon"
                                                            variant="ghost"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Toggle menu</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>
                                                            <Link
                                                                href={`/dashboard/teachers/courses/${course.id}`}
                                                                style={{ width: "100%" }}
                                                            >
                                                                <Button
                                                                    variant={"link"}
                                                                    style={{
                                                                        padding: 0,
                                                                        margin: 0,
                                                                        height: "fit-content",
                                                                        width: "100%",
                                                                        justifyContent: "start",
                                                                    }}
                                                                >
                                                                    Edit
                                                                </Button>
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Button
                                                                variant={"link"}
                                                                onClick={() => deleteCourse(course.id)}
                                                                style={{
                                                                    padding: 0,
                                                                    margin: 0,
                                                                    height: "fit-content",
                                                                    width: "100%",
                                                                    justifyContent: "start",
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground dark:text-gray-400">
                            Showing <strong>{startIndex + 1}-{Math.min(endIndex, totalItems)}</strong> of <strong>{totalItems}</strong> courses
                        </div>
                        {totalPages > 1 && (
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }, (_, i) => (
                                        <PaginationItem key={i}>
                                            <PaginationLink
                                                onClick={() => handlePageChange(i + 1)}
                                                isActive={currentPage === i + 1}
                                                className="dark:text-white dark:hover:bg-gray-700"
                                            >
                                                {i + 1}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default CoursePage;
