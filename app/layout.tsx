import type { Metadata } from "next";
import { Instrument_Serif, Poppins } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "./providers";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CuraLink - Complete Medical AI Diagnosis System",
  description:
    "CuraLink is a comprehensive AI-powered Medical Diagnosis System built with LangChain and Perplexity Sonar models, designed for the Indian healthcare ecosystem with multi-agent AI collaboration, multilingual support, and advanced medical image processing.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSerif.variable} ${poppins.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
