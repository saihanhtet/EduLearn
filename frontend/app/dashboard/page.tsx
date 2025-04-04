"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"
import { useUserProfile } from "../profile/page"
import Loader from "@/components/partials/Loader"
import { DashboardData } from "@/components/dashboard-card"


export default function Page() {
    const { user, isLoading } = useUserProfile();

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader title="Documents" is_student={false} />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            {isLoading ? (
                                <div className="h-[80vh] w-[70vw] flex justify-center items-center">
                                    <Loader />
                                </div>
                            ) : (
                                <>
                                    <DashboardData role={user?.role ? user.role : 'student'} />
                                    {/* <div className="px-4 lg:px-6">
                                        <ChartAreaInteractive />
                                    </div> */}
                                    {/* <DataTable data={data} /> */}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
