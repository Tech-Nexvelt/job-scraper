import { Job, JobStatus } from "./data";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchJobs(): Promise<Job[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/jobs`);
    if (!response.ok) {
        throw new Error("Failed to fetch jobs");
    }
    const data = await response.json();
    
    // Map API data to Frontend Job interface
    return data.map((item: any) => ({
      id: item.id,
      title: item.job_title,
      company: item.company,
      location: item.location || "Remote",
      role: item.role || "General",
      status: (item.status as JobStatus) || "Not Applied",
      dateAdded: new Date(item.created_at).toLocaleDateString(),
      link: item.apply_link,
      isBookmarked: false, // Default for now
    }));
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}
