"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

/**
 * The `DashboardLayout` function is a React component that renders a layout with a sidebar, site
 * header, and children components, with customizable title and student status.
 * @param  - The `DashboardLayout` component takes three parameters:
 * @returns The `DashboardLayout` component is being returned. It consists of a `SidebarProvider`
 * component with custom styles, an `AppSidebar` component, a `SidebarInset` component containing a
 * `SiteHeader` component with `title` and `isStudent` props, and the `children` components passed to
 * the `DashboardLayout`.
 */

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
