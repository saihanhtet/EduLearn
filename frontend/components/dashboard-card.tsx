"use client";

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { apiService } from "@/lib/apiService";
import { CourseGetProps, EnrollmentGetProps, ProgressGetProps, UserDetail } from "@/lib/eventModels";
import { RoleBasedDataTable } from "./role-data-table";

// Props interface for role-based data
interface DashboardCardsProps {
    role: "student" | "admin" | "teacher";
    data: {
        student?: {
            enrolledCourses: number;
            averageProgress: number;
            completedCourses: number;
        };
        admin?: {
            totalRevenue: number;
            totalEnrollments: number;
            monthlyProfitChange: number;
            activeCourses: number;
        };
        teacher?: {
            createdCourses: number;
            studentEngagement: number;
            enrollmentsInCourses: number;
        };
    };
}

export function DashboardData({ role }: { role: "student" | "admin" | "teacher" }) {
    const [dashboardData, setDashboardData] = useState<DashboardCardsProps["data"]>({});
    const [tableData, setTableData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (role === "student") {
                    const enrollments = await apiService.getAll<EnrollmentGetProps>("enrollments");
                    const progress = await apiService.getAll<ProgressGetProps>("progress");
                    setDashboardData({
                        student: {
                            enrolledCourses: enrollments.length,
                            averageProgress: Number(
                                (progress.reduce((sum: number, p: any) => sum + p.progress, 0) / progress.length || 0).toFixed(2)
                            ),
                            completedCourses: progress.filter((p: any) => p.progress === 100).length,
                        },
                    });
                    setTableData(
                        enrollments.map((e: any) => ({
                            id: e.id,
                            courseTitle: e.course.title,
                            progress: progress.find((p: any) => p.course.id === e.course.id)?.progress || 0,
                            enrolledAt: e.enrolled_at,
                        }))
                    );
                } else if (role === "admin") {
                    const enrollments = await apiService.getAll<EnrollmentGetProps>("enrollments");
                    const courses = await apiService.getAll<CourseGetProps>("courses");
                    setDashboardData({
                        admin: {
                            totalRevenue: enrollments.length * 10, // Example: $10 per enrollment
                            totalEnrollments: enrollments.length,
                            monthlyProfitChange: 4.5, // Replace with real calculation
                            activeCourses: courses.length,
                        },
                    });
                    setTableData(
                        enrollments.map((e: any) => ({
                            id: e.id,
                            studentEmail: e.user.email,
                            courseTitle: e.course.title,
                            revenue: 10, // Example revenue per enrollment
                            enrolledAt: e.enrolled_at,
                        }))
                    );
                } else if (role === "teacher") {
                    const courses = await apiService.getAll<CourseGetProps>("courses"); // Filter by created_by in real app
                    const enrollments = await apiService.getAll<EnrollmentGetProps>("enrollments");
                    const progress = await apiService.getAll<ProgressGetProps>("progress");
                    const teacherCourses = courses.filter(
                        async (c: any) => c.created_by.id === (await apiService.getMe<UserDetail>('users')).id
                    );
                    setDashboardData({
                        teacher: {
                            createdCourses: teacherCourses.length,
                            studentEngagement: Number(
                                (progress.reduce((sum: number, p: any) => sum + p.progress, 0) / progress.length || 0).toFixed(2)
                            ),
                            enrollmentsInCourses: enrollments.filter((e: any) =>
                                teacherCourses.some((c: any) => c.id === e.course.id)
                            ).length,
                        },
                    });
                    setTableData(
                        teacherCourses.map((c: any) => {
                            const courseEnrollments = enrollments.filter((e: any) => e.course.id === c.id);
                            const courseProgress = progress.filter((p: any) => p.course.id === c.id);
                            return {
                                id: c.id,
                                courseTitle: c.title,
                                enrollments: courseEnrollments.length,
                                averageProgress:
                                    courseProgress.length > 0
                                        ? Number(
                                            (courseProgress.reduce((sum: number, p: any) => sum + p.progress, 0) /
                                                courseProgress.length).toFixed(2)
                                        )
                                        : 0,
                                createdAt: c.created_at,
                            };
                        })
                    );
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            }
        };
        fetchData();
    }, [role]);

    return (
        <div>
            <CustomCards role={role} data={dashboardData} />
            <div className="p-4 lg:p-6">
                <RoleBasedDataTable role={role} data={tableData} />
            </div>
        </div>
    );
}

export function CustomCards({ role, data }: DashboardCardsProps) {
    return (
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
            {role === "student" && (
                <>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Enrolled Courses</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.student?.enrolledCourses ?? 0}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                    +{Math.round(Math.random() * 10)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Active registrations <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Courses you’re currently enrolled in
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Average Progress</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.student?.averageProgress ?? 0}%
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    {data.student?.averageProgress && data.student.averageProgress > 50 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.student?.averageProgress && data.student.averageProgress > 50 ? "+" : "-"}
                                    {Math.round(Math.random() * 5)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                {data.student?.averageProgress && data.student.averageProgress > 50
                                    ? "Good progress"
                                    : "Progress needs attention"}{" "}
                                {data.student?.averageProgress && data.student.averageProgress > 50 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
                            </div>
                            <div className="text-muted-foreground">
                                Average completion across all courses
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Completed Courses</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.student?.completedCourses ?? 0}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                    +{Math.round(Math.random() * 3)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Achievements unlocked <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Courses fully completed
                            </div>
                        </CardFooter>
                    </Card>
                </>
            )}

            {role === "admin" && (
                <>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Total Revenue</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                ${data.admin?.totalRevenue.toFixed(2) ?? "0.00"}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                    +12.5%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Revenue up this month <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Income from course enrollments
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Total Enrollments</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.admin?.totalEnrollments ?? 0}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                    +{Math.round(Math.random() * 10)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Enrollment growth <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Total students enrolled this period
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Monthly Profit Change</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.admin?.monthlyProfitChange ?? 0}%
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    {data.admin?.monthlyProfitChange && data.admin.monthlyProfitChange > 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.admin?.monthlyProfitChange && data.admin.monthlyProfitChange > 0 ? "+" : ""}
                                    {data.admin?.monthlyProfitChange ?? 0}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                {data.admin?.monthlyProfitChange && data.admin.monthlyProfitChange > 0
                                    ? "Profit increasing"
                                    : "Profit declining"}{" "}
                                {data.admin?.monthlyProfitChange && data.admin.monthlyProfitChange > 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
                            </div>
                            <div className="text-muted-foreground">
                                Profit trend this month
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Active Courses</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.admin?.activeCourses ?? 0}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                    +{Math.round(Math.random() * 5)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Course catalog growing <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Number of active courses
                            </div>
                        </CardFooter>
                    </Card>
                </>
            )}

            {role === "teacher" && (
                <>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Created Courses</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.teacher?.createdCourses ?? 0}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                    +{Math.round(Math.random() * 5)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Courses added <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Total courses you’ve created
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Student Engagement</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.teacher?.studentEngagement ?? 0}%
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    {data.teacher?.studentEngagement && data.teacher.studentEngagement > 50 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.teacher?.studentEngagement && data.teacher.studentEngagement > 50 ? "+" : "-"}
                                    {Math.round(Math.random() * 5)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                {data.teacher?.studentEngagement && data.teacher.studentEngagement > 50
                                    ? "High engagement"
                                    : "Engagement needs boost"}{" "}
                                {data.teacher?.studentEngagement && data.teacher.studentEngagement > 50 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
                            </div>
                            <div className="text-muted-foreground">
                                Average student interaction with your courses
                            </div>
                        </CardFooter>
                    </Card>
                    <Card className="@container/card">
                        <CardHeader>
                            <CardDescription>Enrollments in Your Courses</CardDescription>
                            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                                {data.teacher?.enrollmentsInCourses ?? 0}
                            </CardTitle>
                            <CardAction>
                                <Badge variant="outline">
                                    <IconTrendingUp />
                                    +{Math.round(Math.random() * 10)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Popular courses <IconTrendingUp className="size-4" />
                            </div>
                            <div className="text-muted-foreground">
                                Total students enrolled in your courses
                            </div>
                        </CardFooter>
                    </Card>
                </>
            )}
        </div>
    );
}

// Example usage with mock data
export default function DashboardExample() {
    const studentData = {
        role: "student" as const,
        data: {
            student: {
                enrolledCourses: 5,
                averageProgress: 75,
                completedCourses: 2,
            },
        },
    };

    const adminData = {
        role: "admin" as const,
        data: {
            admin: {
                totalRevenue: 1250.0,
                totalEnrollments: 45678,
                monthlyProfitChange: 4.5,
                activeCourses: 120,
            },
        },
    };

    const teacherData = {
        role: "teacher" as const,
        data: {
            teacher: {
                createdCourses: 10,
                studentEngagement: 60,
                enrollmentsInCourses: 150,
            },
        },
    };

    return (
        <div>
            <h2>Student Dashboard</h2>
            <DashboardCards {...studentData} />
            <h2>Admin Dashboard</h2>
            <DashboardCards {...adminData} />
            <h2>Teacher Dashboard</h2>
            <DashboardCards {...teacherData} />
        </div>
    );
}
