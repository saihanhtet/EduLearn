"use client";
import DashboardLayout from "@/app/dashboard/_layout";
import DescriptionForm from "@/components/forms/description-form";
import ImageForm from "@/components/forms/image-form";
import PriceForm from "@/components/forms/price-form";
import TitleForm from "@/components/forms/title-form";
import { apiService } from "@/lib/apiService";
import { CourseCreateUpdateProps, CourseGetProps } from "@/lib/eventModels";
import { IconLayoutDashboardFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

const CourseEditPage = ({ params }: { params: Promise<{ courseId: string }> }) => {
    const [course, setCourse] = useState<CourseGetProps | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [totalLength, setTotalLength] = useState(0);
    const [completeLength, setCompleteLength] = useState(0);
    const router = useRouter();

    // Unwrap params using React.use()
    const resolvedParams = React.use(params);
    const courseId = resolvedParams.courseId;

    const fetchCourse = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiService.getById<CourseGetProps>("courses", courseId);
            setCourse(data);
        } catch (err) {
            const apiError = err as { message?: string; status?: number };
            const errorMessage = apiError.message || "Failed to load course";
            setError(errorMessage);
            handleApiError(apiError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApiError = (error: { message?: string; status?: number }) => {
        switch (error.status) {
            case 401:
                toast.error("Authentication failed. Please log in again.");
                router.push("/login");
                break;
            case 403:
                toast.error("You do not have permission to access this course.");
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

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    useEffect(() => {
        if (course) {
            const requiredFields = [course.title, course.price, course.description, course.image];
            setTotalLength(requiredFields.length);
            setCompleteLength(requiredFields.filter(Boolean).length);
        }
    }, [course]);

    const updateCourseField = async (field: keyof CourseGetProps, value: unknown) => {
        if (!course) return;
        setIsLoading(true);
        try {
            let updatedCourse: CourseGetProps;
            if (field === "image" && value instanceof File) {
                // Handle file upload
                updatedCourse = await apiService.uploadFile<CourseGetProps>("courses", course.id, value as File, "image");
                console.log("Updated course from upload:", updatedCourse);
            } else if (field === "image" && typeof value === "string") {
                // Image already uploaded, just update state with new URL
                updatedCourse = { ...course, [field]: value };
            } else {
                // Other fields (title, description, price)
                updatedCourse = { ...course, [field]: value };
                await apiService.update<CourseCreateUpdateProps, Partial<CourseCreateUpdateProps>>(
                    "courses",
                    course.id,
                    { [field]: value }
                );
            }
            console.log("Setting course to:", updatedCourse);
            setCourse(updatedCourse);
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`);
        } catch (err) {
            const apiError = err as { message?: string; status?: number };
            const errorMessage = apiError.message || `Failed to update ${field}`;
            setError(errorMessage);
            handleApiError(apiError);
        } finally {
            setIsLoading(false);
        }
    };

    const completionField = `(${completeLength}/${totalLength})`;

    return (
        <DashboardLayout title={`Edit Course: ${course?.title || "Loading..."}`} isStudent={false}>
            <div className="p-6 space-y-6">
                {isLoading && (
                    <div className="text-center text-gray-500 dark:text-gray-400">Loading...</div>
                )}
                {error && (
                    <div className="text-center text-red-500 dark:text-red-400">{error}</div>
                )}
                {!isLoading && !error && course && (
                    <>
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col gap-y-2">
                                <h1 className="text-2xl font-semibold capitalize dark:text-white">
                                    Course Setup
                                </h1>
                                <span className="text-sm text-slate-800 dark:text-gray-300">
                                    Complete all fields {completionField}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex items-center gap-x-2">
                                    <IconLayoutDashboardFilled size={25} />
                                    <h2 className="text-xl capitalize font-semibold dark:text-white">
                                        Customize Your Course
                                    </h2>
                                </div>
                                <TitleForm
                                    initialData={course}
                                    onUpdate={(value) => updateCourseField("title", value)}
                                    disabled={isLoading}
                                />
                                <DescriptionForm
                                    initialData={course}
                                    onUpdate={(value) => updateCourseField("description", value)}
                                    disabled={isLoading}
                                />
                                <ImageForm
                                    initialData={course}
                                    courseId={course.id}
                                    onUpdate={(value) => updateCourseField("image", value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <div className="md:pt-7">
                                    <PriceForm
                                        initialData={course}
                                        onUpdate={(value) => updateCourseField("price", value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default CourseEditPage;
