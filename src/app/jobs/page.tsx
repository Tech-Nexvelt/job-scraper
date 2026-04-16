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

  const JOBS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 when any filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter, statusFilter, date, showAll])

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
        const selectedDateStr = format(date, "yyyy-MM-dd")
        return matchesSearch && matchesRole && matchesStatus && job.dateAdded === selectedDateStr
      } else if (!showAll) {
        const sevenDaysAgoStr = format(subDays(new Date(), 7), "yyyy-MM-dd")
        return matchesSearch && matchesRole && matchesStatus && job.dateAdded >= sevenDaysAgoStr
      } else {
        return matchesSearch && matchesRole && matchesStatus
      }
    })
  }, [jobs, searchQuery, roleFilter, statusFilter, date, showAll, todayStr])

  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE)
  
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * JOBS_PER_PAGE
    return filteredJobs.slice(start, start + JOBS_PER_PAGE)
  }, [filteredJobs, currentPage])

  const groupedJobs = useMemo(() => {
    const groups: Record<string, Job[]> = {}
    paginatedJobs.forEach(job => {
      if (!job.dateAdded || !/^\d{4}-\d{2}-\d{2}$/.test(job.dateAdded)) return
      const d = job.dateAdded
      if (!groups[d]) groups[d] = []
      groups[d].push(job)
    })
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [paginatedJobs])

  // Generate the last 4 days as quick-select tabs (today, yesterday, day before, 3 days ago)
  const quickDays = todayStr
    ? Array.from({ length: 4 }, (_, i) => {
        const d = format(subDays(new Date(todayStr), i), "yyyy-MM-dd")
        const label = i === 0 ? "Today" : i === 1 ? "Yesterday" : format(new Date(d), "dd/MM")
        return { dateStr: d, label }
      })
    : []

  const activeDateStr = date ? format(date, "yyyy-MM-dd") : null

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Jobs</h1>
          <p className="text-muted-foreground">Manage and track all your job applications</p>
        </div>
        <ToggleView view={view} onViewChange={setView} />
      </div>

      {/* Quick-select date tab strip */}
      {todayStr && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[...quickDays].reverse().map(({ dateStr: d, label }) => {
            const isActive = activeDateStr === d
            return (
              <button
                key={d}
                onClick={() => {
                  setShowAll(false)
                  if (activeDateStr === d) {
                    setDate(undefined)
                  } else {
                    setDate(new Date(d + "T00:00:00"))
                  }
                }}
                className={[
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                    : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-primary hover:scale-105",
                ].join(" ")}
              >
                <CalendarIcon className="size-3.5" />
                {label}
              </button>
            )
          })}
          <div className="h-px flex-1 bg-border min-w-4" />
          <DatePicker date={date && !quickDays.some(d => d.dateStr === activeDateStr) ? date : undefined} setDate={setDate} label="Older dates…" />
        </div>
      )}

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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-4 pt-6 mt-10 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl px-4"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="icon"
                      onClick={() => setCurrentPage(page)}
                      className="h-9 w-9 rounded-xl"
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl px-4"
                >
                  Next
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Showing {((currentPage - 1) * JOBS_PER_PAGE) + 1} to {Math.min(currentPage * JOBS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length} jobs
              </p>
            </div>
          )}

          {!date && !showAll && !date && filteredJobs.length >= JOBS_PER_PAGE && (
             <div className="flex flex-col items-center justify-center pt-8">
                <Button 
                  variant="ghost" 
                  className="rounded-xl gap-2 text-primary hover:bg-primary/5"
                  onClick={() => setShowAll(true)}
                >
                  <History className="size-4" />
                  View Full History
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
