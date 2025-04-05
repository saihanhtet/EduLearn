"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"


const DashboardLayout = ({ title, isStudent = false, children }: { title: string, isStudent: boolean, children: React.ReactNode }) => {
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
                <SiteHeader title={title} is_student={isStudent} />
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
};

export default DashboardLayout;
