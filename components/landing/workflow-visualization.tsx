"use client"

import { motion } from "framer-motion"
import { ArrowRight, Brain, Database, FileText, History, Shield, Target } from "lucide-react"
import { AgentCard } from "./agent-card"

const agents = [
  {
    title: "Symptom Analysis Agent",
    description: "Patient ke symptoms ko analyze karke structured form mein convert karta hai.",
    example: "Fever, headache, nausea → ['Fever', 'Headache', 'Nausea']",
    icon: <Target className="w-6 h-6 text-[#151616]" />,
    step: 1
  },
  {
    title: "Medical Literature Agent", 
    description: "Research papers aur trusted medical literature search karke diseases match karta hai.",
    example: "Similar symptoms → [Dengue, Flu, Malaria]",
    icon: <FileText className="w-6 h-6 text-[#151616]" />,
    step: 2
  },
  {
    title: "Health Database Agent",
    description: "WHO, CDC, PubMed databases scan karke current trends check karta hai.",
    example: "Currently dengue cases high in this city",
    icon: <Database className="w-6 h-6 text-[#151616]" />,
    step: 3
  },
  {
    title: "Case History Agent",
    description: "Past patients ke similar cases dekh kar pattern recognition karta hai.",
    example: "Similar cases → mostly dengue confirm hue",
    icon: <History className="w-6 h-6 text-[#151616]" />,
    step: 4
  },
  {
    title: "Risk Assessment Agent",
    description: "Patient details use karke personal risk factors calculate karta hai.",
    example: "Age 25, no history, low risk except mosquito exposure",
    icon: <Shield className="w-6 h-6 text-[#151616]" />,
    step: 5
  },
  {
    title: "Decision Aggregator",
    description: "Sab agents se data collect karke final diagnosis suggest karta hai.",
    example: "Dengue (80%), Flu (15%), Malaria (5%)",
    icon: <Brain className="w-6 h-6 text-[#151616]" />,
    step: 6
  }
]

export const WorkflowVisualization = () => {
  return (
    <section className="py-20 bg-[#FFFFF4]">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-instrument-serif font-bold text-[#151616] mb-4">
            How Our AI Agent Team Works
          </h2>
          <p className="text-xl text-[#151616]/70 font-poppins max-w-3xl mx-auto">
            Ek intelligent team of specialized AI agents jo collaborate karke doctors ko accurate diagnosis provide karte hain
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {agents.map((agent, index) => (
            <AgentCard
              key={agent.title}
              title={agent.title}
              description={agent.description}
              example={agent.example}
              icon={agent.icon}
              delay={index * 0.1}
              step={agent.step}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 text-center"
        >
          <div className="bg-white p-8 rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#f9c80e ] max-w-4xl mx-auto">
            <h3 className="text-2xl font-poppins font-bold text-[#151616] mb-4">
              Result: Smart Assistant Team
            </h3>
            <p className="text-[#151616]/70 font-poppins mb-6">
              Doctor ke paas ek intelligent team hogi jo automatically data collect, compare aur analyze karegi. 
              Isse diagnosis fast, evidence-based aur accurate hoga.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <span className="bg-[#f9c80e ] px-4 py-2 rounded-full border-2 border-[#151616] text-[#151616] font-poppins font-medium text-sm">
                Fast Diagnosis
              </span>
              <span className="bg-[#f9c80e ] px-4 py-2 rounded-full border-2 border-[#151616] text-[#151616] font-poppins font-medium text-sm">
                Evidence-Based
              </span>
              <span className="bg-[#f9c80e ] px-4 py-2 rounded-full border-2 border-[#151616] text-[#151616] font-poppins font-medium text-sm">
                Accurate Results
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}