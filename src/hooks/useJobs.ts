import { useState, useEffect } from "react"
import { Job, JobStatus } from "@/lib/data"
import { fetchJobs, updateJobStatus, toggleJobSave } from "@/lib/api"
import { supabase } from "@/lib/supabase"

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const reloadJobs = async () => {
    const data = await fetchJobs()
    setJobs(data)
    setIsLoading(false)
  }

  const toggleBookmark = async (id: string) => {
    // 1. Find the job
    const job = jobs.find(j => j.id === id)
    if (!job) return

    const newBookmarkState = !job.isBookmarked

    // 2. Optimistic Update (Immediate UI response)
    setJobs(prev => prev.map(j => 
        j.id === id ? { ...j, isBookmarked: newBookmarkState } : j
    ))

    // 3. Sync to Database
    const success = await toggleJobSave(id, newBookmarkState)
    if (!success) {
      // Rollback if failed
      console.error("Failed to sync bookmark to server. Rolling back.")
      setJobs(prev => prev.map(j => 
        j.id === id ? { ...j, isBookmarked: !newBookmarkState } : j
      ))
    }
  }

  const updateStatus = async (id: string, status: JobStatus) => {
    // 1. Optimistic Update
    setJobs(prev => prev.map(j => 
        j.id === id ? { ...j, status } : j
    ))

    // 2. Sync to Database
    const success = await updateJobStatus(id, status)
    if (!success) {
      // In a real app we'd need the old status. For now we just log it.
      console.error("Failed to sync status to server.")
      // Optional: reload from server to be sure
      reloadJobs()
    }
  }

  useEffect(() => {
    reloadJobs()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("jobs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        (payload) => {
          console.log("Real-time change detected:", payload)
          // Since we are using optimistic state for manual changes, 
          // we only reload if it's an EXTERNAL change (like the scraper)
          // For simplicity we reload all, but the optimistic state makes the button feel instant
          reloadJobs()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return { jobs, isLoading, reloadJobs, toggleBookmark, updateStatus }
}
