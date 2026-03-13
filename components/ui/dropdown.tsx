"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface DropdownItem {
  label: string;
  value: string;
  content?: React.ReactNode;
}

interface DropdownProps {
  items: DropdownItem[];
  placeholder?: string;
  onSelect?: (item: DropdownItem) => void;
  className?: string;
  variant?: "default" | "faq" | "select";
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  placeholder = "Select an option",
  onSelect,
  className = "",
  variant = "default"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DropdownItem | null>(null);

  const handleSelect = (item: DropdownItem) => {
    setSelectedItem(item);
    setIsOpen(false);
    onSelect?.(item);
  };

  if (variant === "faq") {
    return (
      <div className={`w-full ${className}`}>
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 1, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="mb-4"
          >
            <button
              className={`flex justify-between items-center w-full text-left p-4 rounded-xl border-2 border-[#151616] transition-all duration-300 ${
                isOpen && selectedItem?.value === item.value
                  ? "bg-gradient-to-r from-[#D6F32F] to-[#D6F32F]/80 shadow-[4px_4px_0px_0px_#151616] translate-y-1" 
                  : "bg-gradient-to-r from-[#FFFFF4] to-white shadow-[4px_4px_0px_0px_#D6F32F] hover:bg-gradient-to-r hover:from-[#D6F32F]/20 hover:to-[#D6F32F]/10 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#D6F32F]"
              }`}
              onClick={() => {
                const newIsOpen = !(isOpen && selectedItem?.value === item.value);
                setIsOpen(newIsOpen);
                setSelectedItem(newIsOpen ? item : null);
              }}
            >
              <span className="font-bold text-[#151616]">{item.label}</span>
              <ChevronDown
                className={`transform transition-all duration-300 ${
                  isOpen && selectedItem?.value === item.value ? "rotate-180 text-[#151616]" : "text-[#151616]/70"
                }`}
              />
            </button>
            <AnimatePresence>
              {isOpen && selectedItem?.value === item.value && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="bg-white/95 backdrop-blur-0 p-4 rounded-b-xl border-2 border-t-0 border-[#151616] shadow-[2px_2px_0px_0px_#D6F32F]"
                >
                  {item.content || <p className="text-[#151616]/80 leading-relaxed">{item.value}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative w-full ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center p-3 rounded-xl border-2 border-[#151616] transition-all duration-300 ${
          isOpen
            ? "bg-gradient-to-r from-[#D6F32F] to-[#D6F32F]/80 shadow-[4px_4px_0px_0px_#151616] translate-y-1"
            : "bg-gradient-to-r from-[#FFFFF4] to-white shadow-[4px_4px_0px_0px_#D6F32F] hover:bg-gradient-to-r hover:from-[#D6F32F]/20 hover:to-[#D6F32F]/10 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_#D6F32F]"
        }`}
      >
        <span className="text-[#151616] font-medium">
          {selectedItem?.label || placeholder}
        </span>
        <ChevronDown
          className={`transform transition-all duration-300 ${
            isOpen ? "rotate-180 text-[#151616]" : "text-[#151616]/70"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-0 border-2 border-[#151616] rounded-xl shadow-[4px_4px_0px_0px_#D6F32F] z-50 overflow-hidden"
          >
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelect(item)}
                className="w-full text-left p-3 text-[#151616] hover:bg-gradient-to-r hover:from-[#D6F32F]/20 hover:to-[#D6F32F]/10 transition-all duration-200 border-b border-[#151616]/10 last:border-b-0"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Custom Select Dropdown for forms
interface SelectDropdownProps {
  options: { label: string; value: string }[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  placeholder = "Select...",
  value,
  onChange,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onChange?.(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center p-3 rounded-xl border-2 border-[#151616] transition-all duration-300 font-medium ${
          isOpen
            ? "bg-gradient-to-r from-[#D6F32F]/30 to-[#D6F32F]/20 shadow-[2px_2px_0px_0px_#151616] translate-y-0.5"
            : "bg-gradient-to-r from-[#FFFFF4] to-white shadow-[3px_3px_0px_0px_#151616] hover:bg-gradient-to-r hover:from-[#D6F32F]/10 hover:to-[#D6F32F]/5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#151616]"
        }`}
      >
        <span className={`${selectedOption ? "text-[#151616]" : "text-[#151616]/60"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 transform transition-all duration-300 ${
            isOpen ? "rotate-180 text-[#151616]" : "text-[#151616]/70"
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-0 border-2 border-[#151616] rounded-xl shadow-[4px_4px_0px_0px_#D6F32F] z-50 overflow-hidden max-h-60 overflow-y-auto"
          >
            {options.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full text-left p-3 transition-all duration-200 border-b border-[#151616]/10 last:border-b-0 ${
                  value === option.value
                    ? "bg-gradient-to-r from-[#D6F32F]/30 to-[#D6F32F]/20 text-[#151616] font-medium"
                    : "text-[#151616] hover:bg-gradient-to-r hover:from-[#D6F32F]/15 hover:to-[#D6F32F]/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};