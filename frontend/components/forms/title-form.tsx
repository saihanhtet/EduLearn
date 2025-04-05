"use client";
import { CourseGetProps } from "@/lib/eventModels";
import React, { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface TitleFormProps {
    initialData: CourseGetProps;
    onUpdate: (value: string) => void;
    disabled?: boolean;
}

const formSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
});

const TitleForm = ({ initialData, onUpdate, disabled }: TitleFormProps) => {
    const [isEditing, setIsEditing] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { title: initialData.title },
    });

    const { isSubmitting, isValid } = form.formState;

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsEditing(false);
        form.reset({ title: values.title });
        onUpdate(values.title); // Delegate update to parent
    };

    const toggleEdit = () => setIsEditing((current) => !current);

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="font-medium flex items-center justify-between">
                Course title
                <Button
                    variant={"ghost"}
                    onClick={toggleEdit}
                    disabled={disabled || isSubmitting}
                    className="dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    {isEditing ? (
                        <>Cancel</>
                    ) : (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </>
                    )}
                </Button>
            </div>
            {!isEditing && (
                <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{initialData.title}</p>
            )}
            {isEditing && (
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input
                                            disabled={isSubmitting || disabled}
                                            placeholder="E.g., Computer Science"
                                            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage className="dark:text-red-400" />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-x-2">
                            <Button
                                disabled={!isValid || isSubmitting || disabled}
                                type="submit"
                                className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                            >
                                Save
                            </Button>
                        </div>
                    </form>
                </Form>
            )}
        </div>
    );
};

export default TitleForm;
