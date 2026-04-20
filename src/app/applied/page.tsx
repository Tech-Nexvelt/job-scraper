"use client"

import React, { useState, useMemo, Suspense } from "react"
import { Job } from "@/lib/data"
import { JobCard } from "@/components/JobCard"
import { JobTable } from "@/components/JobTable"
import { ToggleView } from "@/components/ToggleView"
import { useSearchParams } from "next/navigation"
import { ATSScoreDialog } from "@/components/ATSScoreDialog"
import { CheckCircle2 } from "lucide-react"
import { useJobs } from "@/context/jobs-context"

function AppliedContent() {
  const { jobs: allJobs, isLoading, toggleBookmark, updateStatus } = useJobs()
  const [view, setView] = useState<"card" | "table">("card")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  
  const searchParams = useSearchParams()

  const appliedJobs = useMemo(() => {
    return allJobs.filter(job => job.status === "Applied")
  }, [allJobs])

  const searchQuery = searchParams.get("q") || ""
  const roleFilter = searchParams.get("role") || "all"

  const filteredJobs = useMemo(() => {
    return appliedJobs.filter((job) => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "all" || job.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [appliedJobs, searchQuery, roleFilter])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500 h-8 w-8" />
            Applied Jobs
          </h1>
          <p className="text-muted-foreground">Keep track of the roles you've applied for</p>
        </div>
        <ToggleView view={view} onViewChange={setView} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading your applications...</p>
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
          <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
             <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No applied jobs yet</h3>
          <p className="text-muted-foreground mt-1 max-w-xs text-center">Start applying from 'All Jobs' to see your tracked applications here</p>
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

export default function AppliedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AppliedContent />
    </Suspense>
  )
}
