"use client"

import React from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { ExternalLink, Bookmark, CheckCircle2 } from "lucide-react"
import { Job } from "@/lib/data"
import { cn } from "@/lib/utils"

interface JobTableProps {
  jobs: Job[]
  onToggleBookmark?: (id: string) => void
  onMarkApplied?: (id: string, status: string) => void
}

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function JobTable({ jobs, onToggleBookmark, onMarkApplied }: JobTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied": case "Completed": return "bg-[#2DD4A7]/10 text-[#2DD4A7]"
      case "Interview": return "bg-amber-500/10 text-amber-500"
      case "Rejected": return "bg-rose-500/10 text-rose-500"
      case "Not Applied": case "Not Started": return "bg-slate-500/10 text-slate-500"
      case "Started": return "bg-amber-500/10 text-amber-600"
      default: return ""
    }
  }

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[300px]">Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Added</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="hover:bg-muted/30 transition-colors">
              <TableCell className="font-semibold py-4">
                <div className="flex flex-col">
                  {job.title}
                  <a 
                    href={job.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="md:hidden text-xs text-muted-foreground flex items-center gap-1 hover:text-primary mt-1"
                  >
                    View Listing <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">{job.company}</TableCell>
              <TableCell>
                <Badge variant="outline" className="font-medium bg-muted/20">{job.role}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{job.location}</TableCell>
              <TableCell>
                <Badge className={cn("border-none shadow-none font-medium text-[11px] px-2 py-0.5", getStatusColor(job.status))}>
                  {job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{job.dateAdded}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-8 w-8 rounded-full", job.isBookmarked && "text-amber-500")}
                    onClick={() => onToggleBookmark?.(job.id)}
                  >
                    <Bookmark className="h-4 w-4" fill={job.isBookmarked ? "currentColor" : "none"} />
                  </Button>
                  <a 
                    href={job.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-full hover:bg-muted")}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  
                  <div className="ml-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(
                          "h-8 w-8 rounded-full transition-all flex items-center justify-center hover:bg-muted",
                          job.status === "Completed" ? "text-[#2DD4A7]" : job.status === "Started" ? "text-amber-600" : "text-muted-foreground"
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl border-border/50">
                        <DropdownMenuItem onClick={() => onMarkApplied?.(job.id, "Not Started")} className="text-[10px] font-bold uppercase tracking-wider">
                          Not Started
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMarkApplied?.(job.id, "Started")} className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                          Started
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onMarkApplied?.(job.id, "Completed")} className="text-[10px] font-bold uppercase tracking-wider text-[#2DD4A7]">
                          Completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>

  )
}
