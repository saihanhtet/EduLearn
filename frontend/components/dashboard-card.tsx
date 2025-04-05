// components/dashboard-card.tsx
"use client";

import { useEffect, useState } from "react";
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
import { RoleBasedDataTable } from "./role-data-table";
import { apiService } from "@/lib/apiService";
import { CourseGetProps, EnrollmentGetProps, ProgressGetProps, UserDetail, DashboardProps } from "@/lib/eventModels";
import Loader from "@/components/partials/Loader";

// Props interface for role-based data
interface DashboardCardsProps {
    role: "student" | "admin" | "teacher";
}

export function DashboardData({ role }: DashboardCardsProps) {
    const [dashboardData, setDashboardData] = useState<DashboardProps>({});
    const [tableData, setTableData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<UserDetail | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch the current user to get their ID for the teacher role
                const userData = await apiService.getMe<UserDetail>("users");
                setUser(userData);
                // Fetch dashboard data
                const data = await apiService.getDashboard<DashboardProps>();
                setDashboardData(data);
                // Fetch table data based on the role
                if (role === "student") {
                    const enrollments = await apiService.getAll<EnrollmentGetProps>("enrollments");
                    setTableData(
                        enrollments.map((e: any) => ({
                            id: e.id,
                            courseTitle: e.course.title,
                            progress: e.progress || 0,
                            enrolledAt: e.enrolled_at,
                        }))
                    );
                } else if (role === "admin") {
                    const enrollments = await apiService.getAll<EnrollmentGetProps>("enrollments");
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
                    const courses = await apiService.getAll<CourseGetProps>("courses");
                    const enrollments = await apiService.getAll<EnrollmentGetProps>("enrollments");
                    const progress = await apiService.getAll<ProgressGetProps>("progress");
                    const teacherCourses = courses.filter((c: any) => c.created_by.id === userData.id);
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
                setDashboardData({});
                setTableData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [role]);

    if (isLoading) {
        return (
            <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                <Loader />
            </div>
        );
    }

    return (
        <div>
            <CustomCards role={role} data={dashboardData} />
            <div className="p-4 lg:p-6">
                <RoleBasedDataTable role={role} data={tableData} />
            </div>
        </div>
    );
}

interface CustomCardsProps {
    role: "student" | "admin" | "teacher";
    data: {
        student?: {
            enrolledCourses: number;
            enrolledCoursesChange: number;
            averageProgress: number;
            averageProgressChange: number;
            completedCourses: number;
            completedCoursesChange: number;
        };
        admin?: {
            totalRevenue: number;
            totalRevenueChange: number;
            totalEnrollments: number;
            totalEnrollmentsChange: number;
            monthlyProfitChange: number;
            activeCourses: number;
            activeCoursesChange: number;
        };
        teacher?: {
            createdCourses: number;
            createdCoursesChange: number;
            studentEngagement: number;
            studentEngagementChange: number;
            enrollmentsInCourses: number;
            enrollmentsInCoursesChange: number;
        };
    };
}

export function CustomCards({ role, data }: CustomCardsProps) {
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
                                    {data.student?.enrolledCoursesChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.student?.enrolledCoursesChange >= 0 ? "+" : ""}
                                    {Math.round(data.student?.enrolledCoursesChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Active registrations{" "}
                                {data.student?.enrolledCoursesChange >= 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
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
                                    {data.student?.averageProgressChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.student?.averageProgressChange >= 0 ? "+" : ""}
                                    {Math.round(data.student?.averageProgressChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                {data.student?.averageProgress && data.student.averageProgress > 50
                                    ? "Good progress"
                                    : "Progress needs attention"}{" "}
                                {data.student?.averageProgressChange >= 0 ? (
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
                                    {data.student?.completedCoursesChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.student?.completedCoursesChange >= 0 ? "+" : ""}
                                    {Math.round(data.student?.completedCoursesChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Achievements unlocked{" "}
                                {data.student?.completedCoursesChange >= 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
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
                                    {data.admin?.totalRevenueChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.admin?.totalRevenueChange >= 0 ? "+" : ""}
                                    {Math.round(data.admin?.totalRevenueChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Revenue trend this month{" "}
                                {data.admin?.totalRevenueChange >= 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
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
                                    {data.admin?.totalEnrollmentsChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.admin?.totalEnrollmentsChange >= 0 ? "+" : ""}
                                    {Math.round(data.admin?.totalEnrollmentsChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Enrollment growth{" "}
                                {data.admin?.totalEnrollmentsChange >= 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
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
                                    {Math.round(data.admin?.monthlyProfitChange ?? 0)}%
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
                                    {data.admin?.activeCoursesChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.admin?.activeCoursesChange >= 0 ? "+" : ""}
                                    {Math.round(data.admin?.activeCoursesChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Course catalog growth{" "}
                                {data.admin?.activeCoursesChange >= 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
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
                                    {data.teacher?.createdCoursesChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.teacher?.createdCoursesChange >= 0 ? "+" : ""}
                                    {Math.round(data.teacher?.createdCoursesChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Courses added{" "}
                                {data.teacher?.createdCoursesChange >= 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
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
                                    {data.teacher?.studentEngagementChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.teacher?.studentEngagementChange >= 0 ? "+" : ""}
                                    {Math.round(data.teacher?.studentEngagementChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                {data.teacher?.studentEngagement && data.teacher.studentEngagement > 50
                                    ? "High engagement"
                                    : "Engagement needs boost"}{" "}
                                {data.teacher?.studentEngagementChange >= 0 ? (
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
                                    {data.teacher?.enrollmentsInCoursesChange >= 0 ? (
                                        <IconTrendingUp />
                                    ) : (
                                        <IconTrendingDown />
                                    )}
                                    {data.teacher?.enrollmentsInCoursesChange >= 0 ? "+" : ""}
                                    {Math.round(data.teacher?.enrollmentsInCoursesChange ?? 0)}%
                                </Badge>
                            </CardAction>
                        </CardHeader>
                        <CardFooter className="flex-col items-start gap-1.5 text-sm">
                            <div className="line-clamp-1 flex gap-2 font-medium">
                                Popular courses{" "}
                                {data.teacher?.enrollmentsInCoursesChange >= 0 ? (
                                    <IconTrendingUp className="size-4" />
                                ) : (
                                    <IconTrendingDown className="size-4" />
                                )}
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
