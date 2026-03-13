"use client";

import React, { useState, useEffect } from 'react';
import { Stethoscope, MessageSquare, ChevronRight, HeartHandshake, Bot, Phone, Activity, Shield, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import HealthCallButton from "./HealthCallButton";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "sonner";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({ weight: "600", subsets: ["latin"] });

interface HealthMentorUIProps {
  assistantId?: string;
}

const HealthMentorUI: React.FC<HealthMentorUIProps> = ({ assistantId }) => {
  // Add CSS keyframes for animations
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes textPulse {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      
      @keyframes gradientMove {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      
      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      @keyframes blob {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      
      .animate-blob {
        animation: blob 7s infinite;
      }
      
      .animation-delay-2000 {
        animation-delay: 2s;
      }
      
      .animation-delay-4000 {
        animation-delay: 4s;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFF4]">
      {/* Hero section with blurred gradient background */}
      <div className="relative overflow-hidden py-12">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#f9c80e]/5 via-transparent to-[#151616]/5" />
          <div className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(21, 22, 22, 0.08) 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />
        </div>

        {/* Logo and Hero Content */}
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center z-10">
          <h1 className="text-4xl font-instrument-serif font-bold tracking-tight mb-6 text-[#151616]">
            AI Health Consultation
          </h1>
          <p className="text-xl text-[#151616]/70 font-poppins max-w-2xl">Connect with your AI Health Consultant through a live phone conversation for personalized medical guidance and health support.</p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Call initiation card */}
          <Card className="bg-white  shadow-lg border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 rounded-2xl">
            <CardHeader className=" text-[#151616] rounded-t-xl border-b-2 border-[#151616]">
              <CardTitle className="flex items-center gap-2 font-poppins font-bold">
                <Stethoscope className="h-5 w-5" />
                Start Health Consultation
              </CardTitle>
              <CardDescription className="text-[#151616]/80 font-poppins">
                Enter your number and receive a call from your AI Health Consultant
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <HealthCallButton />
            </CardContent>
            <CardFooter className="border-t-2 border-[#151616] bg-[#FFFFF4] text-sm text-[#151616]/60 font-poppins rounded-b-xl">
              Your phone number is only used to initiate the current consultation call.
            </CardFooter>
          </Card>

          {/* How it works card */}
          <Card className="bg-white shadow-lg border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 rounded-2xl">
            <CardHeader className=" text-black rounded-t-xl border-b-2 border-[#151616]">
              <CardTitle className="flex items-center gap-2 font-poppins font-bold">
                <MessageSquare className="h-5 w-5" />
                How Health Consultation Works
              </CardTitle>
              <CardDescription className="text-black/80 font-poppins">
                Experience real-time health consultation with advanced medical AI
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-[#f9c80e]/20 rounded-full p-2 text-[#151616] border border-[#151616]/20">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-[#151616]">Enter Your Number</h3>
                    <p className="text-sm text-[#151616]/70 font-poppins">Provide your phone number in international format</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-[#f9c80e]/20 rounded-full p-2 text-[#151616] border border-[#151616]/20">
                    <HeartHandshake className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-[#151616]">Receive AI Health Call</h3>
                    <p className="text-sm text-[#151616]/70 font-poppins">Our AI Health Consultant will call you within seconds</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-[#f9c80e]/20 rounded-full p-2 text-[#151616] border border-[#151616]/20">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-poppins font-bold text-[#151616]">Discuss Your Health</h3>
                    <p className="text-sm text-[#151616]/70 font-poppins">Speak naturally about your health concerns and get expert guidance</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t-2 border-[#151616] bg-[#FFFFF4] rounded-b-xl">
              <div className="w-full flex justify-end">
                <a href="#health-features" className="text-[#151616] hover:text-[#151616]/80 font-poppins font-medium flex items-center gap-1 text-sm">
                  Learn more <ChevronRight className="h-4 w-4" />
                </a>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Health Features Section */}
        <section id="health-features" className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-instrument-serif font-bold text-[#151616] mb-4">AI Health Consultation Features</h2>
            <p className="text-lg text-[#151616]/70 font-poppins max-w-3xl mx-auto">
              Our AI Health Consultant provides comprehensive health guidance with the latest medical knowledge and personalized care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 rounded-2xl">
              <CardHeader>
                <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-4">
                  <Activity className="w-6 h-6 text-[#151616]" />
                </div>
                <CardTitle className="text-xl font-bold text-[#151616]">Symptom Analysis</CardTitle>
                <CardDescription className="text-[#151616]/70">
                  Describe your symptoms and get AI-powered analysis with potential causes and recommendations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 rounded-2xl">
              <CardHeader>
                <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-[#151616]" />
                </div>
                <CardTitle className="text-xl font-bold text-[#151616]">Medical Knowledge</CardTitle>
                <CardDescription className="text-[#151616]/70">
                  Access to vast medical databases and latest research for evidence-based health guidance.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white border-2 border-[#151616] shadow-[4px_4px_0px_0px_#151616] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#151616] transition-all duration-200 rounded-2xl">
              <CardHeader>
                <div className="w-12 h-12 bg-[#f9c80e] rounded-xl border-2 border-[#151616] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-[#151616]" />
                </div>
                <CardTitle className="text-xl font-bold text-[#151616]">Personalized Care</CardTitle>
                <CardDescription className="text-[#151616]/70">
                  Tailored health advice based on your medical history, age, lifestyle, and current concerns.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Important Disclaimer */}
        <section className="py-8">
          <Card className="bg-amber-50 border-2 border-amber-300 rounded-2xl shadow-[2px_2px_0px_0px_#151616]">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-poppins font-bold text-amber-800 mb-2">Important Medical Disclaimer</h3>
                  <p className="text-sm text-amber-700 font-poppins">
                    This AI Health Consultant provides general health information and should not replace professional medical advice,
                    diagnosis, or treatment. Always consult with qualified healthcare professionals for serious medical concerns or emergencies.
                    In case of medical emergencies, call your local emergency services immediately.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Toast notifications container */}
      <Toaster />
    </div>
  );
};

export default HealthMentorUI;
