"use client"

import * as React from "react"

interface Profile {
  name: string
  email: string
  role: string
  avatar: string
}

interface ProfileContextType {
  profile: Profile
  updateProfile: (newProfile: Partial<Profile>) => void
}

const ProfileContext = React.createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = React.useState<Profile>({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Senior Product Designer",
    avatar: "/avatar.png",
  })

  const updateProfile = (newProfile: Partial<Profile>) => {
    setProfile((prev) => ({ ...prev, ...newProfile }))
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = React.useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
