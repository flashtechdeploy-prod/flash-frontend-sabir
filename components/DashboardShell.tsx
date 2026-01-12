"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Car,
  Wrench,
  Fuel,
  Package,
  Shield,
  Settings,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  FileWarning,
  Building2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme-context";

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  children?: NavItem[];
};

const navigation: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "HRM",
    items: [
      {
        title: "Master Profiles",
        url: "/employees2",
        icon: Users,
        permission: "employees:view",
      },
      {
        title: "Inactive Employees",
        url: "/employees-inactive",
        icon: Users,
        permission: "employees:view",
      },
      {
        title: "Pending Deactivate",
        url: "/hr/pending-deactivate",
        icon: FileWarning,
        permission: "employees:view",
      },
      {
        title: "Attendance",
        url: "/attendance",
        icon: Calendar,
        permission: "attendance:manage",
      },
      {
        title: "Salaries",
        url: "/payroll2",
        icon: DollarSign,
        permission: "payroll:view",
      },
    ],
  },
  {
    title: "Clients",
    items: [
      {
        title: "Client Management",
        url: "/client-management",
        icon: Building2,
        permission: "clients:view",
      },
    ],
  },
  {
    title: "Accounts/Advances",
    items: [
      {
        title: "Employee Records",
        url: "/accounts-advances/employees",
        icon: Users,
        permission: "accounts:full",
      },
      {
        title: "Expenses",
        url: "/accounts-advances/expenses",
        icon: DollarSign,
        permission: "accounts:full",
      },
    ],
  },
  {
    title: "Fleet Management",
    items: [
      {
        title: "Vehicles",
        url: "/vehicles",
        icon: Car,
        permission: "fleet:view",
      },
      {
        title: "Vehicle Assignments",
        url: "/vehicle-assignments",
        icon: Users,
        permission: "fleet:view",
      },
      {
        title: "Vehicle Maintenance",
        url: "/vehicle-maintenance",
        icon: Wrench,
        permission: "fleet:view",
      },
      {
        title: "Fuel & Mileage",
        url: "/fuel-mileage",
        icon: Fuel,
        permission: "fleet:view",
      },
    ],
  },
  {
    title: "Inventory",
    items: [
      {
        title: "General Inventory",
        url: "/general-inventory",
        icon: Package,
        permission: "inventory:view",
      },
      {
        title: "Restricted Weapons",
        url: "/restricted-inventory",
        icon: Shield,
        permission: "inventory:view",
      },
    ],
  },
  {
    title: "Super Admin",
    items: [
      {
        title: "Overview",
        url: "/super-admin",
        icon: Settings,
        permission: "rbac:admin",
      },
      {
        title: "Users",
        url: "/super-admin/users",
        icon: Users,
        permission: "rbac:admin",
      },
      {
        title: "Roles",
        url: "/super-admin/roles",
        icon: Shield,
        permission: "rbac:admin",
      },
      {
        title: "Permissions",
        url: "/super-admin/permissions",
        icon: Shield,
        permission: "rbac:admin",
      },
    ],
  },
];

function NavMain() {
  const pathname = usePathname();
  const { has } = useAuth();

  return (
    <>
      {navigation.map((group) => {
        const visibleItems = group.items.filter(
          (item) => !item.permission || has(item.permission)
        );
        if (visibleItems.length === 0) return null;

        return (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
                  const Icon = item.icon;

                  if (item.children) {
                    return (
                      <Collapsible key={item.title} defaultOpen={isActive}>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <Icon className="size-4" />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.title}>
                                  <SidebarMenuSubButton asChild isActive={pathname === child.url}>
                                    <Link href={child.url}>{child.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <Icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        );
      })}
    </>
  );
}

function NavUser() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.full_name || user?.username}</span>
                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
              </div>
              <ChevronDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side="top"
            align="start"
            sideOffset={4}
          >
            <DropdownMenuItem onClick={toggleTheme}>
              {isDarkMode ? <Sun className="mr-2 size-4" /> : <Moon className="mr-2 size-4" />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <LayoutDashboard className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold">Flash ERP</span>
                  <span className="truncate text-xs text-muted-foreground">Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    const salutation = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    return `${salutation}, ${user?.full_name || user?.username || "User"}`;
  }, [user?.full_name, user?.username]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">{greeting}</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
