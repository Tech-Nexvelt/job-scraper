"use client"

import * as React from "react"
import { Search, Bell, Moon, Sun, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProfileDialog } from "@/components/ProfileDialog"
import { useProfile } from "@/context/profile-context"
import { useJobs } from "@/context/jobs-context"

const formatDomain = (domain: string) => {
  return domain.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function Navbar() {
  const { setTheme, theme } = useTheme()
  const { profile } = useProfile()
  const { jobs } = useJobs()
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const uniqueRoles = React.useMemo(() => {
    const roles = Array.from(new Set(jobs.map(j => j.role).filter(Boolean)))
    return roles.sort()
  }, [jobs])

  const uniqueDomains = React.useMemo(() => {
    const domains = Array.from(new Set(jobs.map(j => j.domain).filter(Boolean)))
    return domains.sort()
  }, [jobs])

  const handleSearch = (query: string) => {
    const params = new URLSearchParams(searchParams)
    if (query) params.set("q", query)
    else params.delete("q")
    
    if (pathname !== "/jobs" && pathname !== "/saved") {
       router.push(`/jobs?${params.toString()}`)
    } else {
       router.replace(`${pathname}?${params.toString()}`)
    }
  }

  const handleFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams)
    if (value && value !== "all") params.set(key, value)
    else params.delete(key)

    if (pathname !== "/jobs" && pathname !== "/saved") {
      router.push(`/jobs?${params.toString()}`)
    } else {
      router.replace(`${pathname}?${params.toString()}`)
    }
  }

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [isProfileOpen, setIsProfileOpen] = React.useState(false)

  if (!mounted) {
    return (
      <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background/95 px-4 backdrop-blur">
         <div className="flex flex-1 items-center gap-4">
           <div className="h-9 w-64 rounded-md bg-muted/50 animate-pulse" />
         </div>
         <div className="flex items-center gap-4">
           <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse" />
           <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse" />
           <div className="h-8 w-8 rounded-full bg-muted/50 animate-pulse" />
         </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-1 items-center gap-4">
        {/* ... search input and filters ... */}
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search jobs..."
            className="w-full bg-muted/50 pl-9 md:w-[200px] lg:w-[300px] border-none shadow-none focus-visible:ring-1"
            defaultValue={searchParams.get("q") || ""}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Select 
            value={searchParams.get("role") || "all"} 
            onValueChange={(val) => handleFilter("role", val)}
          >
            <SelectTrigger className="h-9 w-[140px] bg-muted/50 border-none shadow-none focus:ring-0 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 text-muted-foreground" />
                <SelectValue placeholder="All Roles" />
              </div>
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Roles</SelectItem>
              {uniqueRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={searchParams.get("domain") || "all"} 
            onValueChange={(val) => handleFilter("domain", val)}
          >
            <SelectTrigger className="h-9 w-[180px] bg-muted/50 border-none shadow-none focus:ring-0 text-xs text-left">
              <SelectValue placeholder="All Domains" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Domains</SelectItem>
              {uniqueDomains.map(domain => (
                <SelectItem key={domain} value={domain}>
                  {formatDomain(domain)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={searchParams.get("status") || "all"} 
            onValueChange={(val) => handleFilter("status", val)}
          >
            <SelectTrigger className="h-9 w-[130px] bg-muted/50 border-none shadow-none focus:ring-0 text-xs text-left">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Applied">Applied</SelectItem>
              <SelectItem value="Not Applied">Not Applied</SelectItem>
              <SelectItem value="Interview">Interview</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <div 
              role="button" 
              className="relative h-8 w-8 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsProfileOpen(true)}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar} alt={profile.name} />
                <AvatarFallback>{profile.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ProfileDialog 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />
      </div>
    </header>
  )
}
