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

function JobsContent() {
  const { jobs, isLoading, toggleBookmark, updateStatus } = useJobs()
  const [view, setView] = useState<"card" | "table">("card")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  
  const searchParams = useSearchParams()

  const searchQuery = searchParams.get("q") || ""
  const roleFilter = searchParams.get("role") || "all"
  const statusFilter = searchParams.get("status") || "all"

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "all" || job.role === roleFilter
      const matchesStatus = statusFilter === "all" || job.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [jobs, searchQuery, roleFilter, statusFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Jobs</h1>
          <p className="text-muted-foreground">Manage and track all your job applications</p>
        </div>
        <ToggleView view={view} onViewChange={setView} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground font-medium animate-pulse">Fetching latest jobs from career portals...</p>
        </div>
      ) : filteredJobs.length > 0 ? (
        view === "card" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
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
          <JobTable 
            jobs={filteredJobs} 
            onToggleBookmark={(id) => toggleBookmark(id)} 
            onMarkApplied={(id) => updateStatus(id, "Applied")}
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
          <h3 className="text-xl font-semibold">No jobs found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
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
