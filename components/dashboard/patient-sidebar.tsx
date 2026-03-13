"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {
  Heart,
  LogOut,
  ClipboardList,
  Brain,
} from "lucide-react"
import { signOut } from "next-auth/react"

const navigationItems = [
  {
    title: "Symptom Analyzer",
    href: "/patient/symptoms",
    icon: Brain,
    description: "AI-powered symptom analysis"
  },
  {
    title: "Prescription",
    href: "/patient/lab-analyzer",
    icon: ClipboardList,
    description: "Lab reports and prescriptions"
  },
]

export function PatientSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <Sidebar className="border-r-2 border-[#151616] bg-white">
      <SidebarHeader className="border-b-2 border-[#151616] p-4">
        <Link href="/patient/dashboard" className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-10 h-10 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center"
          >
            <Heart className="w-6 h-6 text-[#151616]" />
          </motion.div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-instrument-serif font-bold text-[#151616]">
                Okra
              </h1>
              <p className="text-sm font-poppins text-[#151616]/70">
                Patient Portal
              </p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <nav className="space-y-2">
          {navigationItems.map((item, index) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-poppins font-medium group ${isActive
                    ? "bg-[#f9c80e] border-[#151616] shadow-[2px_2px_0px_0px_#151616] text-[#151616]"
                    : "border-transparent hover:border-[#151616] hover:bg-[#FFFFF4] hover:shadow-[2px_2px_0px_0px_#151616] text-[#151616]/70 hover:text-[#151616]"
                    }`}
                >
                  <Icon className={`w-5 h-5 transition-colors flex-shrink-0 ${isActive ? "text-[#151616]" : "text-[#151616]/60 group-hover:text-[#151616]"
                    }`} />
                  {!isCollapsed && (
                    <span className="font-medium text-sm">{item.title}</span>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t-2 border-[#151616] p-4">
        <Button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full bg-white hover:bg-red-50 text-red-600 border-2 border-red-600 shadow-[2px_2px_0px_0px_#red-600] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#red-600] transition-all duration-200 font-poppins font-medium"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {!isCollapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
