export type JobStatus = "Applied" | "Not Applied" | "Interview" | "Rejected" | "Saved" | "Started" | "Completed" | "Not Started";

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  role: string;
  status: JobStatus;
  dateAdded: string;
  domain: string;
  link: string;
  isBookmarked: boolean;
}

export const MOCK_JOBS: Job[] = [];
