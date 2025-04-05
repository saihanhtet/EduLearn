import { Button } from "@/components/ui/button";
import { CourseGetProps } from "@/lib/eventModels";
import Image from "next/image";

const CourseCard = ({ course, isEnrolled = false }: { course: CourseGetProps, isEnrolled: boolean }) => {
    const { id, title, subject, level, description, price, image, created_by, created_at, enrolled_at, progress, completed } = course;

    // Determine if the course is completed
    const isCompleted = completed || (progress !== undefined && progress >= 100);

    // Round the progress percentage to the nearest whole number
    const roundedProgress = Math.round(progress || 0);

    const imageUrl = `${process.env.NEXT_PUBLIC_BACKEND_API_URL}${image}`;

    return (
        <div
            className="course-card bg-white dark:bg-gray-800 shadow-md rounded-md overflow-hidden flex flex-col w-full mb-4"
            key={id}
        >
            {/* Image Section */}
            <Image
                src={imageUrl || "/images/course-image.png"}
                width={500}
                height={200}
                alt="course-image"
                style={{
                    objectFit: "cover",
                    objectPosition: "center",
                    width: "100%",
                }}
                className="h-48 w-full object-cover"
            />

            {/* Content Section */}
            <div className="p-3 flex flex-col flex-grow">
                <h2
                    className={`text-lg font-bold line-clamp-1 ${isEnrolled ? "text-blue-600 dark:text-blue-400" : "dark:text-white"}`}
                >
                    {title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {description || "No description available"}
                </p>

                {isEnrolled ? (
                    <>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 capitalize">
                            {created_by?.username || "EDUClass"} - {subject} - {level}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Started: {enrolled_at
                                ? new Date(enrolled_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })
                                : new Date(created_at).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                        </p>
                    </>
                ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-auto capitalize">
                        {created_by?.username} - ${price || 0}
                    </p>
                )}
                {isEnrolled && (
                    <div>
                        <hr className="my-3 border-gray-200 dark:border-gray-700" />
                        <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-2 w-1/2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full"
                                        style={{ width: `${roundedProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                    {roundedProgress}%
                                </p>
                            </div>

                            <Button
                                variant={"default"}
                                className="capitalize w-full max-w-20 dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                            >
                                {isCompleted ? "View" : "Resume"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseCard;
