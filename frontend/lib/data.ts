import { IconBrandParsinta, IconDashboard, IconLayoutDashboard, IconSettings } from "@tabler/icons-react";

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
        },
        {
            title: "Browse",
            url: "/dashboard/students/browse",
            icon: IconDashboard,
        },
        {
            title: "My Courses",
            url: "/dashboard/students/courses",
            icon: IconBrandParsinta,
        },
        {
            title: "Courses",
            url: "/dashboard/teachers/courses",
            icon: IconBrandParsinta,
        },
    ],
    navSecondary: [
        {
            title: "Settings",
            url: "#",
            icon: IconSettings,
        },
    ],
}
