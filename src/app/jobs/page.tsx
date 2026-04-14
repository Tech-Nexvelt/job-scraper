"use client"

import React, { useState, useMemo, Suspense, useEffect } from "react"
import { Job } from "@/lib/data"
import { JobCard } from "@/components/JobCard"
import { JobTable } from "@/components/JobTable"
import { ToggleView } from "@/components/ToggleView"
import { useSearchParams } from "next/navigation"
import { fetchJobs } from "@/lib/api"
import { ATSScoreDialog } from "@/components/ATSScoreDialog"

import { useJobs } from "@/hooks/useJobs"
import { DatePicker } from "@/components/DatePicker"
import { format, parseISO, subDays } from "date-fns"
import { Calendar as CalendarIcon, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function JobsContent() {
  const { jobs, isLoading, toggleBookmark, updateStatus } = useJobs()
  const [view, setView] = useState<"card" | "table">("card")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [showAll, setShowAll] = useState(false)
  // Use a string form of today's date computed on the client only (avoids hydration mismatch)
  const [todayStr, setTodayStr] = useState<string | null>(null)

  useEffect(() => {
    setTodayStr(format(new Date(), "yyyy-MM-dd"))
  }, [])

  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const roleFilter = searchParams.get("role") || "all"
  const statusFilter = searchParams.get("status") || "all"

  // Sync date with URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (date) {
      params.set("date", format(date, "yyyy-MM-dd"))
    } else {
      params.delete("date")
    }
    window.history.replaceState(null, "", `?${params.toString()}`)
    // Reset showAll when a specific date is picked
    if (date) setShowAll(false)
  }, [date, searchParams])

  const filteredJobs = useMemo(() => {
    // Don't filter until todayStr is computed on client (avoids hydration mismatch)
    if (!todayStr) return []

    return jobs.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "all" || job.role === roleFilter
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      
      if (date) {
        // Specific day selected: pure string comparison, immune to timezone shifts
        const selectedDateStr = format(date, "yyyy-MM-dd")
        return matchesSearch && matchesRole && matchesStatus && job.dateAdded === selectedDateStr
      } else if (!showAll) {
        // Default: last 7 days — compare as strings
        const sevenDaysAgoStr = format(subDays(new Date(), 7), "yyyy-MM-dd")
        return matchesSearch && matchesRole && matchesStatus && job.dateAdded >= sevenDaysAgoStr
      } else {
        // Show all history
        return matchesSearch && matchesRole && matchesStatus
      }
    })
  }, [jobs, searchQuery, roleFilter, statusFilter, date, showAll, todayStr])

  const groupedJobs = useMemo(() => {
    const groups: Record<string, Job[]> = {}
    filteredJobs.forEach(job => {
      // Guard: only group jobs with a valid 'yyyy-MM-dd' dateAdded
      if (!job.dateAdded || !/^\d{4}-\d{2}-\d{2}$/.test(job.dateAdded)) return
      const d = job.dateAdded
      if (!groups[d]) groups[d] = []
      groups[d].push(job)
    })
    // Sort dates in descending order (most recent first)
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredJobs])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Jobs</h1>
          <p className="text-muted-foreground">Manage and track all your job applications</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <DatePicker date={date} setDate={setDate} label="Filter by day" />
          <ToggleView view={view} onViewChange={setView} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground font-medium animate-pulse">Fetching latest jobs from career portals...</p>
        </div>
      ) : groupedJobs.length > 0 ? (
        <div className="space-y-10">
          {groupedJobs.map(([dateStr, dayJobs]) => {
            const displayDate = dateStr === todayStr
              ? "Today"
              : todayStr && dateStr === format(subDays(new Date(), 1), "yyyy-MM-dd")
              ? "Yesterday"
              : format(parseISO(dateStr), "EEEE, MMMM do")

            return (
              <div key={dateStr} className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                    <CalendarIcon className="size-3.5" />
                    {displayDate}
                  </div>
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="outline" className="rounded-full px-3">
                    {dayJobs.length} jobs
                  </Badge>
                </div>
                
                {view === "card" ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {dayJobs.map((job) => (
                      <JobCard 
                        key={job.id} 
                        job={job} 
                        onToggleBookmark={() => toggleBookmark(job.id)} 
                        onMarkApplied={() => updateStatus(job.id, "Applied")}
                        onClick={setSelectedJob}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border-2 shadow-sm overflow-hidden">
                    <JobTable 
                      jobs={dayJobs} 
                      onToggleBookmark={(id) => toggleBookmark(id)} 
                      onMarkApplied={(id) => updateStatus(id, "Applied")}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {!date && !showAll && (
             <div className="flex flex-col items-center justify-center pt-10 border-t">
                <p className="text-muted-foreground mb-4">Showing data for the last 7 days</p>
                <Button 
                  variant="outline" 
                  className="rounded-xl gap-2 h-10 px-6 hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
                  onClick={() => setShowAll(true)}
                >
                  <History className="size-4" />
                  View Older History
                </Button>
             </div>
          )}

          {showAll && (
            <div className="flex justify-center pt-10 border-t items-center gap-2 text-muted-foreground italic text-sm">
              <History className="size-4" />
              Showing all history (Grouped by date)
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
          <h3 className="text-xl font-semibold">No jobs found</h3>
          <p className="text-muted-foreground mt-1">
            {date 
              ? "Try picking another date from the calendar" 
              : "No jobs found in the last 7 days. Try searching or adjusting filters."}
          </p>
        </div>
      )}

      <ATSScoreDialog 
        job={selectedJob} 
        isOpen={!!selectedJob} 
        onClose={() => setSelectedJob(null)} 
      />
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div>Loading jobs...</div>}>
      <JobsContent />
    </Suspense>
  )
}
