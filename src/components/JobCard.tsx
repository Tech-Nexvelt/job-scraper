"use client"

import React from "react"
import { MapPin, Building2, ExternalLink, Bookmark, ChevronDown } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Job } from "@/lib/data"
import { cn } from "@/lib/utils"

interface JobCardProps {
  job: Job
  onToggleBookmark?: (id: string) => void
  onMarkApplied?: (id: string, status: string) => void
  onClick?: (job: Job) => void
}

export function JobCard({ job, onToggleBookmark, onMarkApplied, onClick }: JobCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
      case "Interview": return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
      case "Rejected": return "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20"
      case "Not Applied": return "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20"
      case "Saved": return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
      default: return "bg-muted"
    }
  }

  return (
    <Card 
      className="group relative overflow-hidden border-none shadow-sm transition-all hover:-translate-y-1 hover:shadow-md rounded-2xl cursor-pointer"
      onClick={() => onClick?.(job)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-secondary">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary leading-none">
                {job.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 rounded-full", job.isBookmarked && "text-amber-500")}
              onClick={(e) => {
                e.stopPropagation()
                onToggleBookmark?.(job.id)
              }}
            >
              <Bookmark className="h-4 w-4" fill={job.isBookmarked ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{job.location}</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-md font-medium px-2 py-0.5 text-[11px] uppercase tracking-wider">
            {job.role}
          </Badge>
          <Badge className={cn("rounded-md border-none font-medium px-2 py-0.5 text-[11px] uppercase tracking-wider shadow-none", getStatusColor(job.status))}>
            {job.status}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-muted/30 p-4 transition-colors group-hover:bg-muted/50">
        <a 
          href={job.link} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={cn(buttonVariants({ variant: "link" }), "h-auto p-0 text-xs font-medium text-muted-foreground hover:text-primary flex items-center gap-1")}
        >
          Apply Now <ExternalLink className="h-3 w-3" />
        </a>
        
        <div className="ml-2" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className={cn(
                  "h-7 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all shadow-none flex items-center gap-1 px-3",
                  job.status === "Completed" || job.status === "Applied"
                    ? "bg-[#2DD4A7] text-white border-[#2DD4A7] hover:bg-[#2DD4A7]/90" 
                    : job.status === "Started"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"
                      : "bg-slate-500/5 text-slate-600 border-slate-500/20 hover:bg-slate-500/10"
                )}
              >
                {job.status === "Completed" || job.status === "Applied" ? "Completed" : job.status === "Started" ? "Started" : "Not Started"}
                <ChevronDown className="h-2.5 w-2.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="rounded-xl border-border/50">
              <DropdownMenuItem onClick={() => onMarkApplied?.(job.id, "Not Started" as any)} className="text-[10px] font-bold uppercase tracking-wider">
                Not Started
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkApplied?.(job.id, "Started" as any)} className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Started
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMarkApplied?.(job.id, "Completed" as any)} className="text-[10px] font-bold uppercase tracking-wider text-[#2DD4A7]">
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto text-[11px] text-muted-foreground font-medium">
          Added {job.dateAdded}
        </div>
      </CardFooter>
    </Card>
  )
}
