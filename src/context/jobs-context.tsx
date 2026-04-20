"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Job, JobStatus } from "@/lib/data"
import { fetchJobs, updateJobStatus, toggleJobSave } from "@/lib/api"
import { supabase } from "@/lib/supabase"

interface JobsContextType {
  jobs: Job[]
  isLoading: boolean
  reloadJobs: () => Promise<void>
  toggleBookmark: (id: string) => Promise<void>
  updateStatus: (id: string, status: JobStatus) => Promise<void>
}

const JobsContext = createContext<JobsContextType | undefined>(undefined)

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reloadJobs = async () => {
    const data = await fetchJobs()
    setJobs(data)
    setIsLoading(false)
  }

  const toggleBookmark = async (id: string) => {
    const job = jobs.find(j => j.id === id)
    if (!job) return

    const newBookmarkState = !job.isBookmarked
    setJobs(prev => prev.map(j => 
        j.id === id ? { ...j, isBookmarked: newBookmarkState } : j
    ))

    const success = await toggleJobSave(id, newBookmarkState)
    if (!success) {
      console.error("Failed to sync bookmark to server. Rolling back.")
      setJobs(prev => prev.map(j => 
        j.id === id ? { ...j, isBookmarked: !newBookmarkState } : j
      ))
    }
  }

  const updateStatus = async (id: string, status: JobStatus) => {
    setJobs(prev => prev.map(j => 
        j.id === id ? { ...j, status } : j
    ))

    const success = await updateJobStatus(id, status)
    if (!success) {
      console.error("Failed to sync status to server.")
      reloadJobs()
    }
  }

  useEffect(() => {
    reloadJobs()

    const channel = supabase
      .channel("jobs-realtime-context")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          reloadJobs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <JobsContext.Provider value={{ jobs, isLoading, reloadJobs, toggleBookmark, updateStatus }}>
      {children}
    </JobsContext.Provider>
  )
}

export function useJobs() {
  const context = useContext(JobsContext)
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobsProvider")
  }
  return context
}
