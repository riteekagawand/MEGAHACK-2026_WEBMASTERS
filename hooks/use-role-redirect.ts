"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface UseRoleRedirectOptions {
  requiredRole?: 'patient' | 'clinician'
  requireCompleteInfo?: boolean
  redirectOnMismatch?: boolean
}

export function useRoleRedirect(options: UseRoleRedirectOptions = {}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const {
    requiredRole,
    requireCompleteInfo = false,
    redirectOnMismatch = true
  } = options

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/login")
      return
    }

    if (status === "authenticated" && session) {
      const role = session.role as string
      const hasCompletedInfo = session.hasCompletedInfo as boolean

      // No role set, redirect to role selection
      if (!role) {
        router.push('/select-role')
        return
      }

      // Check role requirements
      if (requiredRole && role !== requiredRole && redirectOnMismatch) {
        if (role === 'clinician') {
          router.push('/medical/dashboard')
        } else if (role === 'patient') {
          router.push(hasCompletedInfo ? '/patient/dashboard' : '/faiz/info')
        }
        return
      }

      // Check completion requirements for patients
      if (requireCompleteInfo && role === 'patient' && !hasCompletedInfo) {
        router.push('/faiz/info')
        return
      }
    }
  }, [status, session, router, requiredRole, requireCompleteInfo, redirectOnMismatch])

  return {
    session,
    status,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated" && !!session,
    role: session?.role as string | undefined,
    hasCompletedInfo: session?.hasCompletedInfo as boolean | undefined
  }
}
