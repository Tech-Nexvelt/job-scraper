import React from "react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and dashboard preferences</p>
      </div>
      <div className="rounded-2xl border bg-card p-12 flex flex-col items-center justify-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4 text-3xl">
          ⚙️
        </div>
        <h2 className="text-xl font-semibold">Settings are coming soon</h2>
        <p className="text-muted-foreground max-w-xs mt-2">
          We&apos;re working on profile management and notification preferences.
        </p>
      </div>
    </div>
  )
}
