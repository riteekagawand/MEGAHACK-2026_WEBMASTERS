"use client"

import { motion } from "framer-motion"
import { ArrowRight, User, Brain } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const flowSteps = [
  {
    agent: "Patient Input",
    input: "Fever, body pain, headache",
    output: "Symptoms recorded",
    icon: <User className="w-5 h-5 text-[#151616]" />,
    color: "#151616"
  },
  {
    agent: "Symptom Agent",
    input: "Raw symptoms",
    output: '["Fever", "Headache", "Body Pain"]',
    icon: <Brain className="w-5 h-5 text-white" />,
    color: "#f9c80e"
  },
  {
    agent: "Literature Agent", 
    input: "Symptom patterns",
    output: "[Dengue, Flu, Malaria]",
    icon: <Brain className="w-5 h-5 text-white" />,
    color: "#f9c80e"
  },
  {
    agent: "Database Agent",
    input: "Current trends",
    output: "Dengue cases high in this city",
    icon: <Brain className="w-5 h-5 text-white" />,
    color: "#f9c80e"
  },
  {
    agent: "Case History Agent",
    input: "Similar cases",
    output: "Mostly dengue confirm hue",
    icon: <Brain className="w-5 h-5 text-white" />,
    color: "#f9c80e"
  },
  {
    agent: "Risk Agent",
    input: "Patient profile",
    output: "Age 25, low risk except mosquito exposure",
    icon: <Brain className="w-5 h-5 text-white" />,
    color: "#f9c80e"
  },
  {
    agent: "Coordinator",
    input: "All agent data",
    output: "Dengue (80%), Flu (15%), Malaria (5%)",
    icon: <Brain className="w-5 h-5 text-[#151616]" />,
    color: "#151616"
  }
]

export const ExampleFlow = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-instrument-serif font-bold text-[#151616] mb-4">
            Live Example Flow
          </h2>
          <p className="text-xl text-[#151616]/70 font-poppins max-w-3xl mx-auto">
            Dekhiye kaise AI agents step-by-step collaborate karke diagnosis provide karte hain
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {flowSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="mb-6 last:mb-0"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-[#151616] flex items-center justify-center"
                  style={{ backgroundColor: step.color }}
                >
                  {step.icon}
                </div>
                
                <Card className="flex-1 border-2 border-[#151616] shadow-[2px_2px_0px_0px_#151616]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-poppins font-bold text-[#151616]">
                      {step.agent}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-3 gap-4 items-center">
                      <div>
                        <p className="text-sm font-poppins font-medium text-[#151616]/60 mb-1">Input:</p>
                        <p className="text-sm font-poppins text-[#151616]">{step.input}</p>
                      </div>
                      <div className="hidden md:flex justify-center">
                        <ArrowRight className="w-5 h-5 text-[#151616]/40" />
                      </div>
                      <div>
                        <p className="text-sm font-poppins font-medium text-[#151616]/60 mb-1">Output:</p>
                        <p className="text-sm font-poppins text-[#151616] font-medium">{step.output}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {index < flowSteps.length - 1 && (
                  <div className="hidden md:block absolute left-6 mt-16 w-0.5 h-6 bg-[#151616]/20"></div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Card className="max-w-2xl mx-auto bg-[#f9c80e] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]">
            <CardHeader>
              <CardTitle className="text-2xl font-poppins font-bold text-[#151616]">
                Final Result for Doctor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-poppins font-semibold text-[#151616] mb-4">
                &ldquo;Most probable: Dengue (80%), Possible: Flu (15%), Malaria (5%)&rdquo;
              </p>
              <p className="text-sm font-poppins text-[#151616]/80">
                Evidence-based diagnosis with confidence scores aur supporting data
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}