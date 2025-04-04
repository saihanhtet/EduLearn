import { Button } from "@/components/ui/button";
import { CourseGetProps } from "@/lib/eventModels";
import Image from "next/image";

const CourseCard = ({ course }: { course: CourseGetProps }) => {
    const { _id, title, description, price, image, created_by } = course;
    return (
        <div className="course-card bg-white shadow-md rounded-md overflow-hidden flex flex-col" key={_id}>
            <Image
                src={image || "/images/course-image.png"}
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
            <div className="px-3 py-2 flex flex-col flex-grow">
                <h2 className="text-lg font-bold line-clamp-1">{title}</h2>
                <p className="text-sm text-gray-600 line-clamp-2">
                    {description || "No description available"}
                </p>
                <p className="text-sm text-gray-600 mt-auto capitalize">{created_by?.username} - ${price}</p>
                <hr className="my-3" />
                <div className="flex justify-between items-center">
                    <Button
                        variant={"link"}
                        className="capitalize"
                        style={{ padding: 0 }}
                    >
                        Learn More
                    </Button>
                    <Button variant={"default"} className="capitalize">
                        Enroll
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default CourseCard;
