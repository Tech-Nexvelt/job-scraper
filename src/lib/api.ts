import { Job, JobStatus, MOCK_JOBS } from "./data";
import { supabase } from "./supabase";

export async function fetchJobs(): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Map API data to Frontend Job interface
    const allJobs: Job[] = (data as any[]).map((item) => ({
      id: item.id.toString(),
      title: item.job_title || "Untitled Position",
      company: item.company || "Unknown Company",
      location: item.location || "Remote",
      role: item.role || "General",
      status: (item.status as JobStatus) || "Not Applied",
      dateAdded: item.created_at 
        ? new Date(item.created_at).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      link: item.apply_link || "#",
      isBookmarked: item.is_saved || false,
    }));

    // Deduplicate by Title + Company
    const seen = new Set<string>();
    const uniqueJobs = allJobs.filter((job) => {
      const key = `${job.title}-${job.company}-${job.location}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueJobs;
  } catch (error) {
    console.error("Supabase Fetch Error:", error);
    if (process.env.NODE_ENV === "development") {
      return MOCK_JOBS;
    }
    return [];
  }
}

export async function toggleJobSave(jobId: string, isSaved: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jobs")
      .update({ is_saved: isSaved })
      .eq("id", jobId);
    
    return !error;
  } catch (error) {
    console.error("Failed to toggle job save:", error);
    return false;
  }
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("jobs")
      .update({ status: status })
      .eq("id", jobId);
    
    return !error;
  } catch (error) {
    console.error("Failed to update job status:", error);
    return false;
  }
}

