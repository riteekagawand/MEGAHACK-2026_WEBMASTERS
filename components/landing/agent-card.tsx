"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AgentCardProps {
    title: string
    description: string
    example: string
    icon: React.ReactNode
    delay: number
    step: number
}

export const AgentCard = ({ title, description, example, icon, delay, step }: AgentCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="relative"
        >
            <Card className="bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 h-full">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center">
                            {icon}
                        </div>
                        <Badge variant="neutral" className="border-[#151616] text-[#151616] font-poppins font-medium">
                            Step {step}
                        </Badge>
                    </div>
                    <CardTitle className="text-xl font-poppins font-bold text-[#151616]">
                        {title}
                    </CardTitle>
                    <CardDescription className="text-[#151616]/70 font-poppins">
                        {description}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="bg-[#FFFFF4] p-3 rounded-xl border border-[#151616]/20">
                        <p className="text-sm text-[#151616]/80 font-poppins italic">
                            &ldquo;{example}&rdquo;
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}