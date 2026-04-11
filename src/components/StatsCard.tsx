import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    positive: boolean
  }
  color?: string
}

export function StatsCard({ title, value, icon: Icon, description, trend, color }: StatsCardProps) {
  return (
    <Card className="overflow-hidden border-none shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="mt-1 text-3xl font-bold tracking-tight">{value}</h3>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${trend.positive ? "text-emerald-500" : "text-rose-500"}`}>
                <span>{trend.positive ? "+" : "-"}{trend.value}%</span>
                <span className="text-muted-foreground text-[10px]">from last month</span>
              </div>
            )}
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-muted ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
