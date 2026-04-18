"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  label?: string
}

export function DatePicker({ date, setDate, label = "Pick a date" }: DatePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "w-[240px] justify-start text-left font-normal rounded-xl border-2 hover:bg-muted/50 transition-all",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {date ? format(date, "PPP") : <span>{label}</span>}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto p-0 rounded-2xl border-2 shadow-2xl animate-in fade-in zoom-in-95" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {date && (
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setDate(undefined)}
          className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
