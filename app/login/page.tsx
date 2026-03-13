"use client"

import { getSession } from "next-auth/react"
import { GoogleSignInButton } from "@/components/auth/google-signin-button"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Stethoscope, Users, ArrowLeft } from "lucide-react"

export default function Login() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkSession = async () => {
            const session = await getSession()
            if (session) {
                // Check if user has completed their info
                try {
                    const response = await fetch('/api/user/info')
                    const data = await response.json()
                    if (data.hasCompletedInfo) {
                        router.push('/dashboard')
                    } else {
                        router.push('/faiz/info')
                    }
                } catch (error) {
                    console.error('Error checking user info:', error)
                    router.push('/faiz/info')
                }
            }
        }
        checkSession()
    }, [router])



    return (
        <div className="min-h-screen bg-[#FFFFF4] relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(#151616 1px, transparent 1px)`,
                        backgroundSize: "48px 48px",
                        opacity: "0.05",
                    }}
                />
            </div>


            {/* Back to Home */}
            <div className="absolute top-6 left-6 z-50">
                <Button
                    onClick={() => {
                        console.log('Button clicked!');
                        window.location.href = '/';
                    }}
                    type="button"
                    className="bg-white text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] active:translate-y-2 active:shadow-[1px_1px_0px_0px_#151616] transition-all duration-200 font-poppins font-medium hover:bg-[#FFFFF4] cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
            </div>

            {/* Main Content */}
            <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="w-full max-w-md"
                >
                    <Card className="w-full border-2 border-[#151616] shadow-[8px_8px_0px_0px_#151616] bg-white">
                        <CardHeader className="space-y-4 text-center pb-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                className="mx-auto w-16 h-16 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center"
                            >
                                <Brain className="w-8 h-8 text-[#151616]" />
                            </motion.div>
                            <div>
                                <CardTitle className="text-3xl font-instrument-serif font-bold text-[#151616] mb-2">
                                    Welcome to CuraLink
                                </CardTitle>
                                <CardDescription className="text-[#151616]/70 font-poppins text-lg">
                                    Join the future of AI-powered medical diagnosis
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            {/* Features Preview */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                    <div className="w-8 h-8 bg-[#D6F32F] rounded-lg border border-[#151616] flex items-center justify-center">
                                        <Brain className="w-4 h-4 text-[#151616]" />
                                    </div>
                                    <span className="text-sm font-poppins text-[#151616]">AI Agent Team for Smart Diagnosis</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                    <div className="w-8 h-8 bg-[#D6F32F] rounded-lg border border-[#151616] flex items-center justify-center">
                                        <Stethoscope className="w-4 h-4 text-[#151616]" />
                                    </div>
                                    <span className="text-sm font-poppins text-[#151616]">Evidence-Based Medical Insights</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-[#FFFFF4] rounded-xl border border-[#151616]/20">
                                    <div className="w-8 h-8 bg-[#D6F32F] rounded-lg border border-[#151616] flex items-center justify-center">
                                        <Users className="w-4 h-4 text-[#151616]" />
                                    </div>
                                    <span className="text-sm font-poppins text-[#151616]">Collaborative Healthcare Platform</span>
                                </div>
                            </div>

                            <GoogleSignInButton className="w-full bg-[#D6F32F] hover:bg-[#D6F32F]/90 text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 font-poppins font-bold text-lg py-6" />

                            <p className="text-center text-sm text-[#151616]/60 font-poppins">
                                By continuing, you agree to our{" "}
                                <a href="#" className="text-[#151616] hover:text-[#D6F32F] font-medium">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#" className="text-[#151616] hover:text-[#D6F32F] font-medium">
                                    Privacy Policy
                                </a>
                            </p>
                        </CardContent>
                    </Card>

                </motion.div>
            </div>
        </div>
    )
}
