"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormLabel,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { apiService } from "@/lib/apiService";
import { CourseCreateUpdateProps, CourseGetProps } from "@/lib/eventModels";
import DashboardLayout from "@/app/dashboard/_layout";

const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    status: z.string().optional(),
    description: z.string().optional(),
    price: z.number().optional(),
    image: z.any().optional(),
});

const CreatePage = () => {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            status: "draft",
            description: "",
            image: "",
            price: 0,
        },
    });

    const { isSubmitting, isValid } = form.formState;
    const router = useRouter();

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Use apiService.create to create a new course
            const response = await apiService.create<CourseGetProps, CourseCreateUpdateProps>("courses", {
                title: values.title,
                status: values.status || "draft",
                description: values.description || "",
                price: values.price || 0,
                image: values.image || "",
            });

            // Assuming the response includes the created course's ID
            router.push(`/dashboard/teachers/courses/${response.id}`);
            toast.success("Course created successfully");
        } catch (error) {
            const apiError = error as { message?: string; status?: number };
            const errorMessage = apiError.message || "Failed to create course";
            toast.error(errorMessage);
            console.error("Error creating course:", error);
        }
    };

    return (
        <DashboardLayout title="Course Creation" isStudent={false}>
            <div className="max-w-xl h-[80vh] mx-auto flex md:items-center md:justify-center p-6 w-full">
                <div className="w-full">
                    <h1 className="text-2xl font-semibold dark:text-white">Create a new course</h1>
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8 mt-8 w-full"
                        >
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="dark:text-white">Course Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                disabled={isSubmitting}
                                                placeholder="e.g. 'Computer Science'"
                                                className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="dark:text-red-400" />
                                        <FormDescription className="dark:text-gray-300">
                                            What will you teach in this course?
                                        </FormDescription>
                                    </FormItem>
                                )}
                            />

                            <div className="flex items-center gap-x-2 w-full justify-between">
                                <Link href="/dashboard/teachers/courses">
                                    <Button type="button" variant={"ghost"} className="dark:text-white dark:hover:bg-gray-700">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={!isValid || isSubmitting}
                                    className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <LoaderCircle className="animate-spin" />{" "}
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        "Create Course"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default CreatePage;
