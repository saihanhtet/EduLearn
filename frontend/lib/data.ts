import {
    IconBrandParsinta,
    IconDashboard,
    IconLayoutDashboard,
    IconSettings,
} from "@tabler/icons-react";

// Define possible roles
type UserRole = "admin" | "student" | "teacher" | "guest";

export const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: IconLayoutDashboard,
            roles: ["admin", "student", "teacher"] as UserRole[], // Accessible to all logged-in users
        },
        {
            title: "Browse",
            url: "/dashboard/students/browse",
            icon: IconDashboard,
            roles: ["student"] as UserRole[], // Only students
        },
        {
            title: "My Courses",
            url: "/dashboard/students/courses",
            icon: IconBrandParsinta,
            roles: ["student"] as UserRole[], // Only students
        },
        {
            title: "Courses",
            url: "/dashboard/teachers/courses",
            icon: IconBrandParsinta,
            roles: ["teacher"] as UserRole[], // Only teachers
        },
        {
            title: "Admin Panel",
            url: "/dashboard/admin",
            icon: IconSettings,
            roles: ["admin"] as UserRole[], // Only admins
        },
    ],
    navSecondary: [
        {
            title: "Settings",
            url: "#",
            icon: IconSettings,
            roles: ["admin", "student", "teacher"] as UserRole[], // Accessible to all logged-in users
        },
    ],
};
