"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { type Icon } from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store";

interface NavItem {
  title: string;
  url: string;
  icon?: Icon;
  roles: string[];
}

export function NavMain({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const userRole = useUserStore((state) => state.user?.role || "guest");

  const filteredItems = items.filter((item) => item.roles.includes(userRole));

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {filteredItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => router.push(item.url)}
                isActive={pathname === item.url}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
