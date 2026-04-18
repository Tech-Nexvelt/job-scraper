"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart3, 
  Bookmark, 
  CheckCircle2,
  ChevronLeft, 
  ChevronRight,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "All Jobs", icon: Briefcase, href: "/jobs" },
  { name: "Saved Jobs", icon: Bookmark, href: "/saved" },
  { name: "Applied Jobs", icon: CheckCircle2, href: "/applied" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center px-4">
        <div className={cn("flex items-center gap-2 font-bold transition-all overflow-hidden", isCollapsed && "w-0 opacity-0")}>
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden">
            <Image src="/NV-logo-short.png" alt="Logo" width={36} height={36} className="object-contain" />
          </div>
          <span className="text-xl whitespace-nowrap">Job Tracker</span>
        </div>
        {isCollapsed && (
          <div className="mx-auto flex h-9 w-9 items-center justify-center overflow-hidden">
            <Image src="/NV-logo-short.png" alt="Logo" width={36} height={36} className="object-contain" />
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-20 z-40 h-6 w-6 rounded-full border bg-background shadow-md lg:flex"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </Button>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-secondary text-secondary-foreground" 
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                isCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className={cn("h-5 w-5", isCollapsed ? "mx-0" : "mr-3")} />
              {!isCollapsed && <span>{item.name}</span>}
              {isActive && !isCollapsed && (
                <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
         <Link
          href="/logout"
          className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className={cn("h-5 w-5", isCollapsed ? "mx-0" : "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </Link>
      </div>
    </aside>
  )
}
