"use client"

import { motion } from "framer-motion"
import {
    Brain,
    Home,
    Users,
    FileText,
    BarChart3,
    Settings,
    Stethoscope,
    Activity,
    Database,
    MessageSquare,
    AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/medical/dashboard",
        icon: Home,
    },
    {
        title: "AI Diagnosis",
        href: "/medical/ai-orchestration",
        icon: Brain,
    },
    {
        title: "Patient Management",
        href: "/medical/patients",
        icon: Users,
    },
    {
        title: "Medical Analytics",
        href: "/medical/analytics",
        icon: BarChart3,
    },
    {
        title: "Medical Research",
        href: "/medical/research",
        icon: Database,
    },
    {
        title: "Epi Alert",
        href: "/medical/epi-alert",
        icon: AlertTriangle,
    }
]

export function DashboardSidebar() {
    const pathname = usePathname()

    return (
        <div className="w-72 bg-white h-screen overflow-y-auto relative border-r-4 border-black">
            <div className="absolute top-0 right-0 w-1 h-full bg-black z-10"></div>
            {/* Logo */}
            <div className="p-6 border-b-2 border-[#151616]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                        <Brain className="w-6 h-6 text-[#151616]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-instrument-serif font-bold text-[#151616]">
                            Okra
                        </h1>
                        <p className="text-sm font-poppins text-[#151616]/60">
                            AI Medical Platform
                        </p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4">
                <div className="space-y-2">
                    {sidebarItems.map((item, index) => {
                        const isActive = pathname === item.href
                        const Icon = item.icon

                        return (
                            <motion.div
                                key={item.href}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 font-poppins font-medium group",
                                        isActive
                                            ? "bg-[#f9c80e] border-[#151616] shadow-[2px_2px_0px_0px_#151616] text-[#151616]"
                                            : "border-transparent hover:border-[#151616] hover:bg-[#FFFFF4] hover:shadow-[2px_2px_0px_0px_#151616] text-[#151616]/70 hover:text-[#151616]"
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "w-5 h-5 transition-colors",
                                            isActive ? "text-[#151616]" : "text-[#151616]/60 group-hover:text-[#151616]"
                                        )}
                                    />
                                    <span className="text-sm">{item.title}</span>
                                </Link>
                            </motion.div>
                        )
                    })}
                </div>
            </nav>



        </div>
    )
}
