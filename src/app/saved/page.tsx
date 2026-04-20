"use client"

import React, { useState, useMemo, Suspense } from "react"
import { Job } from "@/lib/data"
import { JobCard } from "@/components/JobCard"
import { JobTable } from "@/components/JobTable"
import { ToggleView } from "@/components/ToggleView"
import { Bookmark } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useJobs } from "@/context/jobs-context"
import { ATSScoreDialog } from "@/components/ATSScoreDialog"

function SavedJobsContent() {
  const { jobs: allJobs, isLoading, toggleBookmark, updateStatus } = useJobs()
  const [view, setView] = useState<"card" | "table">("card")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get("q") || ""

  const savedJobs = useMemo(() => {
    return allJobs.filter(job => {
      const isSaved = job.isBookmarked
      const matchesSearch = 
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase())
      
      return isSaved && matchesSearch
    })
  }, [allJobs, searchQuery])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Saved Jobs</h1>
          <p className="text-muted-foreground">Keep track of the jobs you&apos;re most interested in</p>
        </div>
        <ToggleView view={view} onViewChange={setView} />
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground font-medium animate-pulse">Loading saved jobs...</p>
        </div>
      ) : savedJobs.length > 0 ? (
        view === "card" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {savedJobs.map((job) => (
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
            jobs={savedJobs} 
            onToggleBookmark={(id) => toggleBookmark(id)} 
            onMarkApplied={(id) => updateStatus(id, "Applied")}
          />
        )
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
            <Bookmark className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">No saved jobs</h3>
          <p className="text-muted-foreground mt-1">Bookmark jobs from the All Jobs page to see them here</p>
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

export default function SavedJobsPage() {
  return (
    <Suspense fallback={<div>Loading saved jobs...</div>}>
      <SavedJobsContent />
    </Suspense>
  )
}
