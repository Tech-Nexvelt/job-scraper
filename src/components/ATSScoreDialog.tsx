"use client"

import React, { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Job } from "@/lib/data"
import { FileText, Brain, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface ATSScoreDialogProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
}

export function ATSScoreDialog({ job, isOpen, onClose }: ATSScoreDialogProps) {
  const [resume, setResume] = useState("")
  const [score, setScore] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!resume.trim() || !job) return

    setIsAnalyzing(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiBaseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: resume,
          job_description: `${job.title} at ${job.company}. Role: ${job.role}. Location: ${job.location}`
        })
      })
      
      const data = await response.json()
      setScore(data.score)
      setFeedback(data.feedback)
    } catch (error) {
      console.error("Analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const reset = () => {
    setScore(null)
    setFeedback([])
    setResume("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) onClose(); reset(); }}>
      <DialogContent className="sm:max-w-[600px] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Brain className="h-6 w-6 text-primary" />
            AI Resume Analyzer
          </DialogTitle>
          <DialogDescription>
            Check how well your resume matches the <strong>{job?.title}</strong> role at <strong>{job?.company}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-6">
          {!score ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Paste your Resume Content
              </div>
              <Textarea 
                placeholder="Paste your professional experience, skills, and education here..."
                className="min-h-[200px] rounded-2xl bg-muted/30 border-none focus-visible:ring-primary/20"
                value={resume}
                onChange={(e) => setResume(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="flex flex-col items-center justify-center p-8 bg-primary/5 rounded-3xl border border-primary/10">
                <div className="relative flex items-center justify-center">
                  <svg className="h-32 w-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * score) / 100}
                      className="text-primary transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">{score}%</span>
                </div>
                <p className="mt-4 font-semibold text-lg">Overall Match Score</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">AI Insights</h4>
                <div className="grid gap-2">
                  {feedback.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-muted/30 rounded-xl text-sm italic">
                       {i % 2 === 0 ? (
                         <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                       ) : (
                         <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                       )}
                       {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {!score ? (
            <Button 
              className="w-full h-12 rounded-2xl font-bold text-lg" 
              onClick={handleAnalyze}
              disabled={!resume.trim() || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                "Analyze ATS Match"
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-2xl font-bold" 
              onClick={() => setScore(null)}
            >
              Analyze Another Version
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
