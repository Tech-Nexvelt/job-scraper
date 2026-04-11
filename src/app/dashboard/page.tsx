"use client"

import React from "react"
import { Briefcase, Send, Users, XCircle } from "lucide-react"
import { StatsCard } from "@/components/StatsCard"
import { RoleChart, StatusChart, ActivityChart } from "@/components/Charts"

export default function DashboardPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track your job applications at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Jobs"
          value={15}
          icon={Briefcase}
          trend={{ value: 12, positive: true }}
          color="text-blue-500"
        />
        <StatsCard
          title="Applied"
          value={6}
          icon={Send}
          trend={{ value: 8, positive: true }}
          color="text-emerald-500"
        />
        <StatsCard
          title="Interviews"
          value={3}
          icon={Users}
          trend={{ value: 25, positive: true }}
          color="text-amber-500"
        />
        <StatsCard
          title="Rejected"
          value={2}
          icon={XCircle}
          trend={{ value: 5, positive: false }}
          color="text-rose-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleChart />
        <StatusChart />
        <ActivityChart />
      </div>
    </div>
  )
}
