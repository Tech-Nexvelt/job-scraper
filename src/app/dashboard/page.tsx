"use client"

import React from "react"
import { Briefcase, Send, Users, XCircle } from "lucide-react"
import { StatsCard } from "@/components/StatsCard"
import { RoleChart, StatusChart, ActivityChart } from "@/components/Charts"

import { startOfMonth, subMonths, endOfMonth, parseISO } from "date-fns"
import { useJobs } from "@/hooks/useJobs"

export default function DashboardPage() {
  const { jobs, isLoading } = useJobs()

  const stats = React.useMemo(() => {
    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const getStatsForRange = (jobsList: typeof jobs) => {
      const total = jobsList.length
      const applied = jobsList.filter(j => 
        j.status === "Applied" || j.status === "Completed" || j.status === "Started"
      ).length
      const interviews = jobsList.filter(j => j.status === "Interview").length
      const rejected = jobsList.filter(j => j.status === "Rejected").length
      return { total, applied, interviews, rejected }
    }

    const thisMonthJobs = jobs.filter(j => parseISO(j.dateAdded) >= thisMonthStart)
    const lastMonthJobs = jobs.filter(j => {
      const date = parseISO(j.dateAdded)
      return date >= lastMonthStart && date <= lastMonthEnd
    })

    const currentStats = getStatsForRange(thisMonthJobs)
    const previousStats = getStatsForRange(lastMonthJobs)
    const totalStats = getStatsForRange(jobs)

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return { value: current > 0 ? 100 : 0, positive: true }
      const change = ((current - previous) / previous) * 100
      return { value: Math.abs(Math.round(change)), positive: change >= 0 }
    }

    return {
      total: totalStats.total,
      applied: totalStats.applied,
      interviews: totalStats.interviews,
      rejected: totalStats.rejected,
      trends: {
        total: calculateTrend(currentStats.total, previousStats.total),
        applied: calculateTrend(currentStats.applied, previousStats.applied),
        interviews: calculateTrend(currentStats.interviews, previousStats.interviews),
        rejected: calculateTrend(currentStats.rejected, previousStats.rejected),
      }
    }
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
          trend={stats.trends.total}
          color="text-primary"
        />
        <StatsCard
          title="Applied"
          value={stats.applied}
          icon={Send}
          trend={stats.trends.applied}
          color="text-emerald-500"
        />
        <StatsCard
          title="Interviews"
          value={stats.interviews}
          icon={Users}
          trend={stats.trends.interviews}
          color="text-amber-500"
        />
        <StatsCard
          title="Rejected"
          value={stats.rejected}
          icon={XCircle}
          trend={stats.trends.rejected}
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
