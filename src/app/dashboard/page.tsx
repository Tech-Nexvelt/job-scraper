"use client"

import React from "react"
import { Briefcase, Send, Users, XCircle } from "lucide-react"
import { StatsCard } from "@/components/StatsCard"
import { RoleChart, StatusChart, ActivityChart } from "@/components/Charts"

import { useJobs } from "@/hooks/useJobs"

export default function DashboardPage() {
  const { jobs, isLoading } = useJobs()

  const stats = React.useMemo(() => {
    const total = jobs.length
    // Count both explicitly "Applied" (legacy) and the new "Completed" and "Started" states
    const applied = jobs.filter(j => 
      j.status === "Applied" || 
      j.status === "Completed" || 
      j.status === "Started"
    ).length
    const interviews = jobs.filter(j => j.status === "Interview").length
    const rejected = jobs.filter(j => j.status === "Rejected").length

    return { total, applied, interviews, rejected }
  }, [jobs])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Track your job applications at a glance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Jobs"
          value={stats.total}
          icon={Briefcase}
          trend={{ value: 12, positive: true }}
          color="text-primary"
        />
        <StatsCard
          title="Applied"
          value={stats.applied}
          icon={Send}
          trend={{ value: 8, positive: true }}
          color="text-emerald-500"
        />
        <StatsCard
          title="Interviews"
          value={stats.interviews}
          icon={Users}
          trend={{ value: 25, positive: true }}
          color="text-amber-500"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          trend={{ value: 5, positive: false }}
          color="text-rose-500"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <RoleChart jobs={jobs} />
        <StatusChart jobs={jobs} />
        <ActivityChart jobs={jobs} />
      </div>
    </div>
  )
}
