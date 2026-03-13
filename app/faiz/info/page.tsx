"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Gender = "male" | "female" | "other"

export default function PatientInfoPage() {
  const { status } = useSession()
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [age, setAge] = useState("")
  const [gender, setGender] = useState<Gender>("male")
  const [location, setLocation] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const canSubmit = useMemo(() => {
    const parsedAge = Number(age)
    return Number.isFinite(parsedAge) && parsedAge > 0 && location.trim().length > 1 && !saving
  }, [age, location, saving])

  async function onSubmit() {
    if (!canSubmit) return
    setSaving(true)
    try {
      const res = await fetch("/api/user/info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age, gender, location }),
      })

      if (!res.ok) {
        setSaving(false)
        return
      }

      // Ask NextAuth to re-read token fields (role/hasCompletedInfo) after DB update
      await fetch("/api/auth/session?update")
      router.push("/patient/dashboard")
    } catch {
      setSaving(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFFF4]">
        <div className="w-8 h-8 border-4 border-[#151616]/30 border-t-[#151616] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFF4] flex items-center justify-center px-6 py-12">
      <Card className="w-full max-w-xl border-2 border-[#151616] shadow-[8px_8px_0px_0px_#151616] bg-white">
        <CardHeader>
          <CardTitle className="text-3xl font-instrument-serif font-bold text-[#151616]">
            Complete your profile
          </CardTitle>
          <CardDescription className="text-[#151616]/70 font-poppins">
            This helps personalize your patient dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-poppins font-medium text-[#151616]">Age</label>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-md border-2 border-[#151616] px-3 py-2 font-poppins"
              placeholder="e.g. 24"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-poppins font-medium text-[#151616]">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full rounded-md border-2 border-[#151616] px-3 py-2 font-poppins bg-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-poppins font-medium text-[#151616]">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-md border-2 border-[#151616] px-3 py-2 font-poppins"
              placeholder="City, Country"
            />
          </div>

          <Button
            onClick={onSubmit}
            disabled={!canSubmit}
            className="w-full bg-[#D6F32F] hover:bg-[#D6F32F]/90 text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 font-poppins font-bold py-6"
          >
            {saving ? "Saving..." : "Continue"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

