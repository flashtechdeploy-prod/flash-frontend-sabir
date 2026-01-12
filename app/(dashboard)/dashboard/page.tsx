"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth";
import { useApi } from "@/hooks/use-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  Car,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Shield,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const { data: employeesData } = useApi<{ employees: unknown[]; total: number }>("/api/employees", { limit: 1 });
  const { data: vehiclesData } = useApi<{ status: string }[]>("/api/vehicles", { limit: 100 });
  const { data: clientsData } = useApi<unknown[]>("/api/clients", { limit: 1 });
  const { data: attendanceData } = useApi<{ records: { status: string }[] }>("/api/attendance", { date: today });
  const { data: inventoryData } = useApi<unknown[]>("/api/general-inventory/items");
  const { data: restrictedData } = useApi<unknown[]>("/api/restricted-inventory/items");

  const totalEmployees = employeesData?.total || 0;
  const totalVehicles = Array.isArray(vehiclesData) ? vehiclesData.length : 0;
  const activeVehicles = Array.isArray(vehiclesData) ? vehiclesData.filter(v => v.status === "active").length : 0;
  const totalClients = Array.isArray(clientsData) ? clientsData.length : 0;
  const attendanceRecords = attendanceData?.records || [];
  const presentToday = attendanceRecords.filter(r => r.status === "present" || r.status === "late").length;
  const absentToday = attendanceRecords.filter(r => r.status === "absent").length;
  const totalInventory = Array.isArray(inventoryData) ? inventoryData.length : 0;
  const totalRestricted = Array.isArray(restrictedData) ? restrictedData.length : 0;

  const quickLinks = [
    { href: "/employees2", label: "Manage Employees", icon: Users, color: "text-blue-500" },
    { href: "/vehicles", label: "Manage Vehicles", icon: Car, color: "text-green-500" },
    { href: "/client-management", label: "Manage Clients", icon: Building2, color: "text-purple-500" },
    { href: "/attendance", label: "Mark Attendance", icon: Calendar, color: "text-orange-500" },
    { href: "/payroll2", label: "Process Payroll", icon: DollarSign, color: "text-emerald-500" },
    { href: "/general-inventory", label: "Inventory", icon: Package, color: "text-cyan-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.username}! Here's an overview of your operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-3xl font-bold">{totalEmployees}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                <p className="text-3xl font-bold">{activeVehicles}<span className="text-lg text-muted-foreground">/{totalVehicles}</span></p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Car className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold">{totalClients}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="text-3xl font-bold">{presentToday}</p>
                {absentToday > 0 && (
                  <p className="text-xs text-destructive">{absentToday} absent</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                <Package className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">General Inventory</p>
                <p className="text-2xl font-bold">{totalInventory}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Shield className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Restricted Items</p>
                <p className="text-2xl font-bold">{totalRestricted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Today's Date</p>
                <p className="text-2xl font-bold">{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <link.icon className={`h-5 w-5 ${link.color}`} />
                    <span>{link.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Placeholder */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">System ready</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Database connected</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Storage configured</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {absentToday > 0 ? (
                <div className="flex items-center gap-3 text-sm">
                  <Badge variant="destructive">{absentToday}</Badge>
                  <span>employees absent today</span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No alerts at this time</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
