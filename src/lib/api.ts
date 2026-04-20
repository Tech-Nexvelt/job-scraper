import { Job, JobStatus } from "./data";
import { supabase } from "./supabase";

export async function fetchJobs(): Promise<Job[]> {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Map API data to Frontend Job interface
    const allJobs: Job[] = (data || []).map((item) => ({
      id: item.id.toString(),
      title: item.job_title || "Untitled Position",
      company: item.company || "Unknown Company",
      location: item.location || "Remote",
      role: item.role || "General",
      domain: item.domain || "Other",
      status: (item.status as JobStatus) || "Not Applied",
      dateAdded: item.created_at 
        ? new Date(item.created_at).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      link: item.apply_link || "#",
      isBookmarked: item.is_saved || false,
    }));

    return allJobs;
  } catch (error) {
    console.error("Supabase Fetch Error:", error);
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

