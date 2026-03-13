"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProfileDropdown } from "./profile-dropdown"

interface DashboardHeaderProps {
  userRole?: 'clinician' | 'patient'
}

export function DashboardHeader({ userRole = 'clinician' }: DashboardHeaderProps) {
    const getSearchPlaceholder = () => {
        return userRole === 'clinician' 
            ? "Search patients, cases, or medical data..."
            : "Search health records, appointments, or symptoms..."
    }

    return (
        <header className="h-16 bg-white border-b-2 border-[#151616] shadow-[0px_2px_0px_0px_#151616] flex items-center justify-between px-6">
            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#151616]/60" />
                    <input
                        type="text"
                        placeholder={getSearchPlaceholder()}
                        className="w-96 pl-10 pr-4 py-2 border-2 border-[#151616] rounded-xl font-poppins text-sm placeholder:text-[#151616]/60 focus:outline-none focus:ring-0 focus:border-[#D6F32F] transition-colors"
                    />
                </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                {/* Notifications */}
                <Button
                    className="relative bg-white border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616] hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 p-3"
                >
                    <Bell className="w-5 h-5 text-[#151616]" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D6F32F] border border-[#151616] rounded-full"></div>
                </Button>

                {/* Profile Dropdown */}
                <ProfileDropdown />
            </div>
        </header>
    )
}
