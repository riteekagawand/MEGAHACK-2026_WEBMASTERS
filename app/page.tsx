"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Brain,
  Users,
  Zap,
  Shield,
  Stethoscope,
  Activity,
  Target,
} from "lucide-react";
import { WorkflowVisualization } from "@/components/landing/workflow-visualization";
import { ExampleFlow } from "@/components/landing/example-flow";
import { Dropdown } from "@/components/ui/dropdown";


const FeatureCard = ({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-6 rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200"
  >
    <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-4">
      <Icon className="w-6 h-6 text-[#151616]" />
    </div>
    <h3 className="text-lg font-poppins font-bold text-[#151616] mb-2">{title}</h3>
    <p className="text-[#151616]/70 font-poppins">{description}</p>
  </motion.div>
);



const NavBar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileNavClick = (elementId: string) => {
    setIsMobileMenuOpen(false);
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const headerOffset = 120;
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  return (
    <>
      <div className="fixed top-4 left-0 right-0 z-[9999] hidden md:flex justify-center">
        <header
          className={`flex flex-row items-center justify-between rounded-lg bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-300 ${isScrolled ? "max-w-3xl px-2" : "max-w-5xl px-4"
            } py-2 w-full mx-4`}
          style={{
            willChange: "transform",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            perspective: "1000px",
          }}
        >
          <Link
            className={`z-50 flex items-center justify-center gap-2 transition-all duration-300 ${isScrolled ? "ml-4" : ""
              }`}
            href="/"
          >
            <span className="text-[#151616] font-instrument-serif font-bold tracking-tight text-lg">Orka</span>
          </Link>

          <div className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-[#151616]/70 transition duration-200 hover:text-[#151616] md:flex md:space-x-2">
            <a
              className="relative px-4 py-2 text-[#151616]/70 hover:text-[#151616] transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById("features");
                if (element) {
                  const headerOffset = 120;
                  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                  const offsetPosition = elementPosition - headerOffset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <span className="relative z-20">AI Agents</span>
            </a>
            <a
              className="relative px-4 py-2 text-[#151616]/70 hover:text-[#151616] transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById("benefits");
                if (element) {
                  const headerOffset = 120;
                  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                  const offsetPosition = elementPosition - headerOffset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <span className="relative z-20">Benefits</span>
            </a>
            <a
              className="relative px-4 py-2 text-[#151616]/70 hover:text-[#151616] transition-colors cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById("faq");
                if (element) {
                  const headerOffset = 120;
                  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
                  const offsetPosition = elementPosition - headerOffset;

                  window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth",
                  });
                }
              }}
            >
              <span className="relative z-20">FAQ</span>
            </a>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="/login"
              className="rounded-md font-poppins font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-gradient-to-b from-[#D6F32F] to-[#D6F32F]/80 text-[#151616] shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm border-2 border-[#151616]"
            >
              Log In
            </a>

            <a
              href="/dashboard"
              className="rounded-md font-poppins font-bold relative cursor-pointer hover:-translate-y-0.5 transition duration-200 inline-block text-center bg-gradient-to-b from-[#D6F32F] to-[#D6F32F]/80 text-[#151616] shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] px-4 py-2 text-sm border-2 border-[#151616]"
            >
              Get Started
            </a>
          </div>
        </header>
      </div>

      <header className="fixed top-4 z-[9999] mx-4 flex w-auto flex-row items-center justify-between rounded-full bg-white/95 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] md:hidden px-4 py-3">
        <Link
          className="flex items-center justify-center gap-2"
          href="/"
        >
          <span className="text-[#151616] font-instrument-serif font-bold tracking-tight text-base">Orka</span>
        </Link>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/50 border border-[#151616]/20 transition-colors hover:bg-white/80"
          aria-label="Toggle menu"
        >
          <div className="flex flex-col items-center justify-center w-5 h-5 space-y-1">
            <span
              className={`block w-4 h-0.5 bg-[#151616] transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-[#151616] transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-4 h-0.5 bg-[#151616] transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""}`}
            ></span>
          </div>
        </button>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden">
          <div className="absolute top-20 left-4 right-4 bg-white/95 backdrop-blur-0 border border-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] p-6">
            <nav className="flex flex-col space-y-4">
              <button
                onClick={() => handleMobileNavClick("features")}
                className="text-left px-4 py-3 text-lg font-medium text-[#151616]/70 hover:text-[#151616] transition-colors rounded-lg hover:bg-white/50"
              >
                AI Agents
              </button>
              <button
                onClick={() => handleMobileNavClick("benefits")}
                className="text-left px-4 py-3 text-lg font-medium text-[#151616]/70 hover:text-[#151616] transition-colors rounded-lg hover:bg-white/50"
              >
                Benefits
              </button>
              <button
                onClick={() => handleMobileNavClick("faq")}
                className="text-left px-4 py-3 text-lg font-medium text-[#151616]/70 hover:text-[#151616] transition-colors rounded-lg hover:bg-white/50"
              >
                FAQ
              </button>
              <div className="border-t border-[#151616]/20 pt-4 mt-4 flex flex-col space-y-3">
                <a
                  href="/login"
                  className="px-4 py-3 text-lg font-poppins font-bold text-center bg-gradient-to-b from-[#D6F32F] to-[#D6F32F]/80 text-[#151616] rounded-lg shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-2 border-[#151616]"
                >
                  Log In
                </a>
                <a
                  href="/dashboard"
                  className="px-4 py-3 text-lg font-poppins font-bold text-center bg-gradient-to-b from-[#D6F32F] to-[#D6F32F]/80 text-[#151616] rounded-lg shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-2 border-[#151616]"
                >
                  Get Started
                </a>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
};




const FAQ = () => {
  const faqs = [
    {
      label: "How does Orka protect patient medical data?",
      value: "data-protection",
      content: (
        <p className="text-[#151616]/80 leading-relaxed">
          We use enterprise-grade encryption and HIPAA-compliant security measures to protect all medical data. Patient information is encrypted in transit and at rest, with role-based access controls and full audit logs.
        </p>
      ),
    },
    {
      label: "Is Orka suitable for all medical specialties?",
      value: "medical-specialties",
      content: (
        <p className="text-[#151616]/80 leading-relaxed">
          Orka is designed to assist healthcare professionals across various specialties. Our AI agents are trained on diverse medical literature and can provide insights for general practice, internal medicine, and specialized fields.
        </p>
      ),
    },
    {
      label: "How accurate are the AI-powered diagnostic suggestions?",
      value: "ai-accuracy",
      content: (
        <p className="text-[#151616]/80 leading-relaxed">
          Our AI agents are trained on vast medical datasets and continuously updated with latest research. While they provide evidence-based suggestions, all recommendations require human clinical judgment and approval from qualified healthcare professionals.
        </p>
      ),
    },
    {
      label: "Can I integrate Orka with existing hospital systems?",
      value: "integration",
      content: (
        <p className="text-[#151616]/80 leading-relaxed">
          Yes, Orka supports integration with existing EHR systems through FHIR/HL7 standards and DICOM compatibility. We offer flexible deployment options including on-premise and cloud-based solutions.
        </p>
      ),
    },
  ];

  return (
    <section id="faq" className="py-20 bg-[#FFFFF4]">
      <div className="container mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#151616]">
          Frequently Asked Questions
        </h2>
        <div className="max-w-3xl mx-auto">
          <Dropdown items={faqs} variant="faq" />
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-[#151616] text-white py-12">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 text-[#D6F32F]">Orka</h3>
          <p className="text-sm text-gray-400">
            Empowering healthcare professionals with AI-driven diagnostic insights and
            multi-agent collaboration for better patient outcomes.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Platform</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="#features"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                AI Agents
              </a>
            </li>
            <li>
              <a
                href="#benefits"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                Benefits
              </a>
            </li>
            <li>
              <a
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a
                href="#faq"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Resources</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="/medical"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                Medical Tools
              </a>
            </li>
            <li>
              <a
                href="/lab-analyzer"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                Lab Analyzer
              </a>
            </li>
            <li>
              <a
                href="/nutrition-ai"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                Nutrition AI
              </a>
            </li>
            <li>
              <a
                href="/consultations"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                Consultations
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-4">Support</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="mailto:support@Orka.com"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                support@Orka.com
              </a>
            </li>
            <li>
              <a
                href="tel:+1-800-Orka"
                className="text-sm text-gray-400 hover:text-[#D6F32F] transition-colors"
              >
                +1 (800) Orka
              </a>
            </li>
            <li>
              <span className="text-sm text-gray-400">
                HIPAA Compliant
              </span>
            </li>
            <li>
              <span className="text-sm text-gray-400">
                24/7 Medical Support
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400 mb-4 md:mb-0">
            &copy; 2025 Orka. All rights reserved. | Privacy Policy | Terms of Service
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-xs text-gray-500">Powered by AI</span>
            <div className="flex space-x-3">
              <a href="#" className="text-gray-400 hover:text-[#D6F32F] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-[#D6F32F] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

const FinancialAdvisorLanding = () => {
  return (
    <div className="min-h-screen bg-[#FFFFF4] relative overflow-hidden">
      {/* Dotted Background */}
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

      <NavBar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative z-10">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center max-w-3xl mx-auto mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 bg-[#151616] text-white rounded-full px-4 py-2 mb-6 border-2 border-[#151616] shadow-[4px_4px_0px_0px_#D6F32F]"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <motion.div
                className="w-2 h-2 bg-[#D6F32F] rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              />
              <span className="text-sm font-poppins font-medium">Multi-Agent Clinical AI</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-instrument-serif font-bold text-[#151616] mb-6">
              AI Agent Team for
              <div className="relative inline-block mx-2">
                <span className="relative z-10">Smarter, Faster</span>
                <motion.div
                  className="absolute bottom-2 left-0 right-0 h-4 bg-[#D6F32F] -z-10"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
              Medical Diagnosis
            </h1>

            <p className="text-xl text-[#151616]/70 mb-8 max-w-3xl mx-auto font-poppins">
              Ek intelligent team of specialized AI agents jo collaborate karke doctors ko accurate, evidence-based diagnosis provide karte hain in record time.
            </p>

            <div className="flex gap-4 justify-center">
              <motion.a
                href="/login"
                className="bg-[#D6F32F] px-8 py-4 rounded-2xl text-xl font-poppins font-bold text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try Orka
                <Stethoscope className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="#how-it-works"
                className="px-8 py-4 rounded-2xl text-xl font-poppins font-bold border-2 border-[#151616] hover:bg-[#151616]/5 transition-all duration-200 text-[#151616] shadow-[4px_4px_0px_0px_#D6F32F] flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                See AI Agents
                <Brain className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>

          {/* Trust Strip */}
          <div className="max-w-3xl mx-auto mb-16">
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-[#151616]/80">
              <span className="text-sm font-poppins font-medium">AI-Powered Diagnosis</span>
              <span className="hidden md:inline">•</span>
              <span className="text-sm font-poppins font-medium">Evidence-Based</span>
              <span className="hidden md:inline">•</span>
              <span className="text-sm font-poppins font-medium">Multi-Agent System</span>
              <span className="hidden md:inline">•</span>
              <span className="text-sm font-poppins font-medium">Real-time Collaboration</span>
            </div>
          </div>

          {/* Value Props */}
          <div
            id="features"
            className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto"
          >
            <FeatureCard
              icon={Brain}
              title="Smart Analysis"
              description="AI agents analyze symptoms, literature, aur databases to provide comprehensive insights."
              delay={0.1}
            />
            <FeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Multiple specialized agents work together like a medical team for better accuracy."
              delay={0.2}
            />
            <FeatureCard
              icon={Zap}
              title="Faster Diagnosis"
              description="Automated research aur pattern recognition compress diagnosis time from hours to minutes."
              delay={0.3}
            />
            <FeatureCard
              icon={Shield}
              title="Evidence-Based"
              description="Every suggestion backed by medical literature, case history, aur risk assessment."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      <WorkflowVisualization />

      <ExampleFlow />

      {/* Benefits */}
      <section className="py-20 bg-white" id="benefits">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-4xl font-instrument-serif font-bold text-center mb-12 text-[#151616]">
            Benefits for Medical Teams
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-[#FFFFF4] p-6 rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]"
            >
              <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-4">
                <Stethoscope className="w-6 h-6 text-[#151616]" />
              </div>
              <h3 className="text-xl font-poppins font-bold mb-3 text-[#151616]">For Doctors</h3>
              <p className="text-[#151616]/70 font-poppins">
                Fast, evidence-based diagnosis suggestions with supporting literature aur case patterns.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-[#FFFFF4] p-6 rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]"
            >
              <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-[#151616]" />
              </div>
              <h3 className="text-xl font-poppins font-bold mb-3 text-[#151616]">For Hospitals</h3>
              <p className="text-[#151616]/70 font-poppins">
                Improved diagnostic accuracy, reduced time-to-treatment, aur better patient outcomes.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-[#FFFFF4] p-6 rounded-2xl border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616]"
            >
              <div className="w-12 h-12 bg-[#D6F32F] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-[#151616]" />
              </div>
              <h3 className="text-xl font-poppins font-bold mb-3 text-[#151616]">For Patients</h3>
              <p className="text-[#151616]/70 font-poppins">
                Faster diagnosis, reduced wait times, aur more accurate treatment plans.
              </p>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-center mt-10"
          >
            <a
              href="/login"
              className="inline-block bg-[#D6F32F] px-8 py-4 rounded-2xl text-xl font-poppins font-bold text-[#151616] border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200"
            >
              Start Using Orka
            </a>
          </motion.div>
        </div>
      </section>

      {/* Agents */}
      <section className="py-20 bg-[#FFFFF4]">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#151616]">Agents At-a-Glance</h2>
          <div className="flex flex-wrap gap-3 justify-center">
            {[
              "myGP",
              "Ray",
              "Dye",
              "Preez",
              "Clint",
              "Cole",
              "Surge",
              "Cally",
              "Cory",
              "Carey",
              "Benfy",
            ].map((agent) => (
              <span key={agent} className="px-3 py-1 rounded-full border-2 border-[#151616] bg-white text-[#151616] text-sm shadow-[2px_2px_0px_0px_#151616]">
                {agent}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Safety & Compliance */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#151616]">Safety & Compliance</h2>
          <div className="grid md:grid-cols-3 gap-8 text-[#151616]">
            <div>
              <h3 className="font-bold mb-2">Human-in-the-loop</h3>
              <p className="text-[#151616]/70">Clinicians approve, edit, or override every step.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Data governance</h3>
              <p className="text-[#151616]/70">PHI encryption in transit & at rest; role-based access; full audit logs.</p>
            </div>
            <div>
              <h3 className="font-bold mb-2">Standards</h3>
              <p className="text-[#151616]/70">Integrates via FHIR/HL7; supports DICOM; HIPAA-ready deployment options.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-[#FFFFF4]">
        <div className="container mx-auto px-6 max-w-5xl text-[#151616]">
          <h2 className="text-3xl font-bold text-center mb-12">Results</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-[#151616] text-center">
              <div className="text-4xl font-black mb-2">↓ 35%</div>
              <p className="text-[#151616]/70">time from imaging to pathology review</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-[#151616] text-center">
              <div className="text-4xl font-black mb-2">↑ 22%</div>
              <p className="text-[#151616]/70">same-week specialist scheduling</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border-2 border-[#151616] text-center">
              <div className="text-4xl font-black mb-2">↑ 18%</div>
              <p className="text-[#151616]/70">trial eligibility matches surfaced</p>
            </div>
          </div>
          <div className="text-center mt-10">
            <a href="#case-studies" className="inline-block px-8 py-4 rounded-2xl text-xl font-bold border-2 border-[#151616] hover:bg-[#151616]/5 text-[#151616] shadow-[4px_4px_0px_0px_#D6F32F]">See case studies</a>
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />

    </div>
  );
};

export default FinancialAdvisorLanding;