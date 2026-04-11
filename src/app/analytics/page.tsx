"use client"

import React from "react"
import { RoleChart, StatusChart, ActivityChart } from "@/components/Charts"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts"

const monthlyPerformance = [
  { month: "Jan", applications: 12, interviews: 2 },
  { month: "Feb", applications: 18, interviews: 4 },
  { month: "Mar", applications: 25, interviews: 7 },
  { month: "Apr", applications: 15, interviews: 5 },
]

import { useJobs } from "@/hooks/useJobs"

export default function AnalyticsPage() {
  const { jobs, isLoading } = useJobs()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Detailed Analytics</h1>
        <p className="text-muted-foreground">Deep dive into your job search performance</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RoleChart jobs={jobs} />
        <StatusChart jobs={jobs} />
        <Card className="border-none shadow-sm h-[400px]">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Success Ratio</CardTitle>
            <CardDescription>Interviews vs Applications</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                />
                <Legend />
                <Bar dataKey="applications" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="interviews" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Application Growth</CardTitle>
            <CardDescription>Monthly trend of job applications</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ fill: "#3b82f6", r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <ActivityChart jobs={jobs} />
      </div>
    </div>
  )
}
