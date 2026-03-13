"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, User, Settings, LogOut, Shield } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function ProfileDropdown() {
    const { data: session } = useSession()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    const handleLogout = async () => {
        // Clear any cached data and sign out completely
        try {
            // Clear local storage and session storage
            localStorage.clear()
            sessionStorage.clear()
            
            // Sign out with redirect to login
            await signOut({
                callbackUrl: "/login",
                redirect: true,
            })
        } catch (error) {
            console.error('Logout error:', error)
            // Force redirect even if signOut fails
            window.location.href = "/login"
        }
    }

    if (!session?.user) {
        return null
    }

    return (
        <div className="relative">
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-4 py-2 border-2 border-[#151616] transition-all duration-300 font-poppins font-medium text-[#151616] ${
                    isOpen
                        ? "bg-gradient-to-r from-[#D6F32F] to-[#D6F32F]/80 shadow-[4px_4px_0px_0px_#151616] translate-y-1"
                        : "bg-gradient-to-r from-[#FFFFF4] to-white shadow-[4px_4px_0px_0px_#D6F32F] hover:bg-gradient-to-r hover:from-[#D6F32F]/20 hover:to-[#D6F32F]/10 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#D6F32F]"
                }`}
            >
                <Avatar className="w-8 h-8 border-2 border-[#151616]">
                    <AvatarImage
                        src={session.user.image || ""}
                        alt={session.user.name || "User"}
                    />
                    <AvatarFallback className="bg-[#D6F32F] text-[#151616] font-bold text-sm">
                        {session.user.name?.charAt(0) || "U"}
                    </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-[#151616]/60">{session.user.email}</p>
                </div>
                <ChevronDown
                    className={`w-4 h-4 transition-all duration-300 ${
                        isOpen ? 'rotate-180 text-[#151616]' : 'text-[#151616]/70'
                    }`}
                />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-0 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#D6F32F] rounded-xl z-50"
                        >
                            {/* User Info */}
                            <div className="p-4 border-b-2 border-[#151616]">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12 border-2 border-[#151616]">
                                        <AvatarImage
                                            src={session.user.image || ""}
                                            alt={session.user.name || "User"}
                                        />
                                        <AvatarFallback className="bg-[#D6F32F] text-[#151616] font-bold">
                                            {session.user.name?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="font-poppins font-semibold text-[#151616]">
                                            {session.user.name}
                                        </p>
                                        <p className="text-sm font-poppins text-[#151616]/60">
                                            {session.user.email}
                                        </p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <Shield className="w-3 h-3 text-[#D6F32F]" />
                                            <span className="text-xs font-poppins text-[#151616]/60">
                                                Medical Professional
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Items */}
                            <div className="p-2">
                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        router.push('/profile')
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-[#D6F32F]/15 hover:to-[#D6F32F]/10 transition-all duration-200 font-poppins text-[#151616] text-sm"
                                >
                                    <User className="w-4 h-4" />
                                    <span>View Profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsOpen(false)
                                        // Add settings navigation logic here
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-[#D6F32F]/15 hover:to-[#D6F32F]/10 transition-all duration-200 font-poppins text-[#151616] text-sm"
                                >
                                    <Settings className="w-4 h-4" />
                                    <span>Settings</span>
                                </button>

                                <div className="border-t border-[#151616]/20 my-2"></div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-red-100 hover:to-red-50 hover:text-red-600 transition-all duration-200 font-poppins text-[#151616] text-sm"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
