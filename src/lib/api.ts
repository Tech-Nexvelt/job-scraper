import { Job, JobStatus, MOCK_JOBS } from "./data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) {
        throw new Error("Failed to fetch jobs");
    }
    const data = await response.json();
    
    // Map API data to Frontend Job interface
    const allJobs = data.map((item: any) => ({
      id: item.id.toString(),
      title: item.job_title || "Untitled Position",
      company: item.company || "Unknown Company",
      location: item.location || "Remote",
      role: item.role || "General",
      status: (item.status as JobStatus) || "Not Applied",
      dateAdded: item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
      link: item.apply_link || "#",
      isBookmarked: item.is_saved || false,
    }));

    // Deduplicate by Title + Company (to avoid different URLs for same job)
    const seen = new Set();
    const uniqueJobs = allJobs.filter((job: any) => {
      const key = `${job.title}-${job.company}-${job.location}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueJobs;
  } catch (error) {
    console.error("API Error at " + API_BASE_URL + ":", error);
    if (process.env.NODE_ENV === "development") {
      return MOCK_JOBS;
    }
    return [];
  }
}

export async function toggleJobSave(jobId: string, isSaved: boolean): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/save`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_saved: isSaved }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to toggle job save:", error);
    return false;
  }
}

export async function updateJobStatus(jobId: string, status: JobStatus): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status }),
    });
    return response.ok;
  } catch (error) {
    console.error("Failed to update job status:", error);
    return false;
  }
}
