"use client"

import React, { useState, useMemo, Suspense, useEffect } from "react"
import { Job, JobStatus } from "@/lib/data"
import { JobCard } from "@/components/JobCard"
import { JobTable } from "@/components/JobTable"
import { ToggleView } from "@/components/ToggleView"
import { useSearchParams } from "next/navigation"
import { ATSScoreDialog } from "@/components/ATSScoreDialog"

import { useJobs } from "@/context/jobs-context"
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
  const [showAll, setShowAll] = useState(true)
  // Use a string form of today's date computed on the client only (avoids hydration mismatch)
  const [todayStr, setTodayStr] = useState<string | null>(null)

  useEffect(() => {
     
    setTodayStr(format(new Date(), "yyyy-MM-dd"))
  }, [])

  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const roleFilter = searchParams.get("role") || "all"
  const statusFilter = searchParams.get("status") || "all"
  const domainFilter = searchParams.get("domain") || "all"

  // Sync date with URL params
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (date) {
      params.set("date", format(date, "yyyy-MM-dd"))
    } else {
      params.delete("date")
    }
    window.history.replaceState(null, "", `?${params.toString()}`)
  }, [date, searchParams])

  const JOBS_PER_PAGE = 20
  const [currentPage, setCurrentPage] = useState(1)

  // Reset to page 1 when any filter changes - using render-time adjustment for React 18/19 compatibility
  const [prevFilters, setPrevFilters] = useState({ searchQuery, roleFilter, statusFilter, domainFilter, date, showAll })
  if (
      prevFilters.searchQuery !== searchQuery || 
      prevFilters.roleFilter !== roleFilter ||
      prevFilters.statusFilter !== statusFilter || 
      prevFilters.domainFilter !== domainFilter || 
      prevFilters.date !== date || 
      prevFilters.showAll !== showAll
  ) {
    setCurrentPage(1)
    setPrevFilters({ searchQuery, roleFilter, statusFilter, domainFilter, date, showAll })
  }

  const filteredJobs = useMemo(() => {
    // Don't filter until todayStr is computed on client (avoids hydration mismatch)
    if (!todayStr) return []

    return jobs.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "all" || job.role === roleFilter
      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      const matchesDomain = domainFilter === "all" || job.domain === domainFilter
      
      if (date) {
        const selectedDateStr = format(date, "yyyy-MM-dd")
        return matchesSearch && matchesRole && matchesStatus && matchesDomain && job.dateAdded === selectedDateStr
      } else if (!showAll) {
        const sevenDaysAgoStr = format(subDays(new Date(), 7), "yyyy-MM-dd")
        return matchesSearch && matchesRole && matchesStatus && matchesDomain && job.dateAdded >= sevenDaysAgoStr
      } else {
        return matchesSearch && matchesRole && matchesStatus && matchesDomain
      }
    })
  }, [jobs, searchQuery, roleFilter, statusFilter, domainFilter, date, showAll, todayStr])

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

  // Generate pagination range with ellipses
  const getPaginationRange = () => {
    const siblingCount = 2
    const totalPageNumbers = 9 // Increased to reflect more visible pages

    if (totalPages <= totalPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1)
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages)

    const shouldShowLeftDots = leftSiblingIndex > 2
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 7
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1)
      return [...leftRange, "...", totalPages]
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 7
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1)
      return [1, "...", ...rightRange]
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i)
      return [1, "...", ...middleRange, "...", totalPages]
    }

    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

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
          <DatePicker 
            date={date && !quickDays.some(d => d.dateStr === activeDateStr) ? date : undefined} 
            setDate={(newDate) => {
              setDate(newDate)
              if (newDate) setShowAll(false)
            }} 
            label="Older dates…" 
          />
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
                        onMarkApplied={(id, status) => updateStatus(id, status as JobStatus)}
                        onClick={setSelectedJob}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border-2 shadow-sm overflow-hidden">
                    <JobTable 
                      jobs={dayJobs} 
                      onToggleBookmark={(id) => toggleBookmark(id)} 
                      onMarkApplied={(id, status) => updateStatus(id, status as JobStatus)}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-6 pt-10 mt-10 border-t">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={currentPage === 1}
                  className="rounded-full px-5 border-2 hover:border-primary/60 hover:text-primary transition-all active:scale-95 disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {getPaginationRange().map((page, index) => {
                    if (page === "...") {
                      return (
                        <div key={`dots-${index}`} className="w-10 h-10 flex items-center justify-center text-muted-foreground font-bold">
                          ...
                        </div>
                      )
                    }
                    
                    const pageNum = page as number
                    const isActive = currentPage === pageNum
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setCurrentPage(pageNum)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className={[
                          "h-10 w-10 rounded-full text-sm font-bold border-2 transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110"
                            : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-primary hover:scale-105",
                        ].join(" ")}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1))
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  disabled={currentPage === totalPages}
                  className="rounded-full px-5 border-2 hover:border-primary/60 hover:text-primary transition-all active:scale-95 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>

              <div className="flex items-center gap-2 px-4 py-1.5 bg-muted/30 rounded-full border border-border/50">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Showing <span className="text-foreground">{((currentPage - 1) * JOBS_PER_PAGE) + 1}</span> - <span className="text-foreground">{Math.min(currentPage * JOBS_PER_PAGE, filteredJobs.length)}</span> of <span className="text-foreground">{filteredJobs.length}</span> results
                </p>
              </div>
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
