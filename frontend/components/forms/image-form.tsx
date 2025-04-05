"use client";
import { CourseGetProps } from "@/lib/eventModels";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageIcon, Pencil, PlusCircle } from "lucide-react";
import Image from "next/image";
import { apiService } from "@/lib/apiService";

interface ImageFormProps {
    initialData: CourseGetProps;
    courseId: string | number;
    onUpdate: (value: string) => void; // Expect string (relative URL)
    disabled?: boolean;
}

const ImageForm = ({ initialData, courseId, onUpdate, disabled }: ImageFormProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [preview, setPreview] = useState<string | null>(
        initialData.image ? `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/${initialData.image}` : null
    );

    const handleFileUpload = async (file: File) => {
        try {
            const updatedCourse = await apiService.uploadFile<CourseGetProps>(
                "courses",
                courseId,
                file,
                "image"
            );
            const fullImageUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/${updatedCourse.image}`;
            console.log("Server response image (relative):", updatedCourse.image);
            console.log("Full image URL:", fullImageUrl);
            setPreview(fullImageUrl);
            setIsEditing(false);
            onUpdate(updatedCourse.image);
        } catch (err) {
            console.error("Upload error:", err);
            throw err; // Let CourseEditPage handle the error
        }
    };

    const toggleEdit = () => setIsEditing((current) => !current);

    return (
        <div className="mt-6 border bg-slate-100 rounded-md p-4 dark:bg-gray-800 dark:border-gray-700">
            <div className="font-medium flex items-center justify-between">
                Course image
                <Button
                    variant={"ghost"}
                    onClick={toggleEdit}
                    disabled={disabled}
                    className="dark:text-gray-300 dark:hover:bg-gray-700"
                >
                    {isEditing && <>Cancel</>}
                    {!isEditing && !initialData.image && (
                        <>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add
                        </>
                    )}
                    {!isEditing && initialData.image && (
                        <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                        </>
                    )}
                </Button>
            </div>
            {!isEditing &&
                (!preview ? (
                    <div className="flex items-center justify-center h-60 bg-slate-200 rounded-md dark:bg-gray-700">
                        <ImageIcon className="h-10 w-10 text-slate-500 dark:text-gray-400" />
                    </div>
                ) : (
                    <div className="relative aspect-video mt-2">
                        <Image
                            alt="Course image"
                            fill
                            className="object-cover rounded-md"
                            src={`${preview}?t=${Date.now()}`} // Cache busting
                        />
                    </div>
                ))}
            {isEditing && (
                <div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const localPreview = URL.createObjectURL(file);
                                console.log("Local preview URL:", localPreview);
                                setPreview(localPreview);
                                handleFileUpload(file);
                            }
                        }}
                        disabled={disabled}
                        className="dark:text-gray-300"
                    />
                    {preview && (
                        <div className="relative aspect-video mt-2">
                            <Image
                                alt="Preview"
                                fill
                                className="object-cover rounded-md"
                                src={`${preview}?t=${Date.now()}`} // Cache busting
                            />
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-4 dark:text-gray-400">
                        Upload an image (16:9 aspect ratio recommended)
                    </p>
                </div>
            )}
        </div>
    );
};

export default ImageForm;
