"use client"

import React from "react"
import { LayoutGrid, Table as TableIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ToggleViewProps {
  view: "card" | "table"
  onViewChange: (view: "card" | "table") => void
}

export function ToggleView({ view, onViewChange }: ToggleViewProps) {
  return (
    <Tabs 
      value={view} 
      onValueChange={(v) => onViewChange(v as "card" | "table")} 
      className="w-auto"
    >
      <TabsList className="grid w-[120px] grid-cols-2 bg-muted/50 p-1">
        <TabsTrigger value="card" className="data-[state=active]:bg-background">
          <LayoutGrid className="h-4 w-4" />
        </TabsTrigger>
        <TabsTrigger value="table" className="data-[state=active]:bg-background">
          <TableIcon className="h-4 w-4" />
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
