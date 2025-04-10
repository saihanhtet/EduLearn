"use client"

import { useUserProfile } from "@/app/profile/page";
import { DashboardData } from "@/components/dashboard-card";
import Loader from "@/components/partials/Loader";
import DashboardLayout from "./_layout";

export default function Page() {
    /* The line `const { user, isLoading } = useUserProfile();` is using the `useUserProfile` custom
    hook to retrieve data related to the user profile. */
    const { user, isLoading } = useUserProfile();

    return (
        <DashboardLayout title="Dashboard" isStudent={true}>
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex flex-1 flex-col gap-2">
                    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                        {isLoading ? (
                            <div className="flex h-[80vh] w-[70vw] items-center justify-center">
                                <Loader />
                            </div>
                        ) : (
                            <DashboardData role={user?.role ? user.role : "student"} />
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
