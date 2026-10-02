import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, User, Sparkles } from "lucide-react";
import { ICP } from "../../../types";
import { processOnboardingChat } from "../../../services/onboarding.service";
import { useOnboardingStore } from "../../../stores/onboarding.store";

interface OnboardingProps {
  onComplete: (icp: ICP) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const messages = useOnboardingStore((s) => s.messages);
  const isLoading = useOnboardingStore((s) => s.isLoading);
  const addMessage = useOnboardingStore((s) => s.addMessage);
  const setIsLoading = useOnboardingStore((s) => s.setIsLoading);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content: input.trim(),
    };

    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const data = await processOnboardingChat(
        [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
        })),
      );

      if (data.isComplete && data.icp) {
        // AI has enough information
        onComplete(data.icp);
      } else {
        // AI needs more information
        addMessage({
          id: Date.now().toString(),
          role: "assistant",
          content: data.reply || "Could you tell me more about your ideal customer?",
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: `Request failed — nothing was generated. ${typeof error === "string" ? error : "Check your Gemini key in Settings, then try again."}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full px-4 md:px-8 py-8 transition-all">
      <div className="flex flex-col h-full w-full bg-white rounded-[24px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-[#F0F0F0] relative z-10 transition-all">
        {/* Header */}
        <div className="flex items-center gap-4 px-8 py-6 border-b border-[#F0F0F0] bg-white">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1EE] flex items-center justify-center border border-[#FFD4CC] relative z-10 shadow-[0_4px_12px_rgba(255,92,57,0.1)]">
              <Sparkles className="w-6 h-6 text-[#FF5C39]" />
            </div>
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-[#171717] tracking-tight flex items-center gap-2">
              Strategic Intelligence Core
              <span className="text-[10px] font-bold bg-[#ECFDF5] text-[#10B981] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Active
              </span>
            </h2>
            <p className="text-[13px] text-[#A1A1AA] font-semibold mt-0.5">
              Engineering ICP & Sales Vector
            </p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[#F4F5F7]/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 animate-scale-in max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
            >
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-[#1A1D20] text-white shadow-md"
                    : "bg-white text-[#FF5C39] border border-[#FFD4CC] shadow-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-5 h-5 stroke-[2.5px]" />
                ) : (
                  <Bot className="w-5 h-5 stroke-[2.5px]" />
                )}
              </div>

              <div
                className={`rounded-[20px] px-6 py-4 text-[14px] leading-relaxed relative ${
                  msg.role === "user"
                    ? "bg-[#1A1D20] text-white rounded-tr-sm shadow-[0_4px_16px_rgba(26,29,32,0.1)]"
                    : "bg-white text-[#171717] border border-[#F0F0F0] rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 animate-fade-in max-w-[85%] mr-auto">
              <div className="w-10 h-10 rounded-2xl bg-white text-[#FF5C39] border border-[#FFD4CC] flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-5 h-5 stroke-[2.5px]" />
              </div>
              <div className="bg-white border border-[#F0F0F0] rounded-[20px] rounded-tl-sm px-6 py-5 flex items-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <div
                  className="w-2 h-2 bg-[#FFD4CC] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#FFD4CC] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-[#FFD4CC] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#F0F0F0]">
          <form onSubmit={handleSubmit} className="relative flex items-center mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Transmit intelligence..."
              disabled={isLoading}
              className="w-full bg-[#F4F5F7] border border-transparent hover:border-[#E0E0E0] rounded-2xl pl-6 pr-16 py-[18px] text-[14px] text-[#171717] font-medium focus:outline-none focus:bg-white focus:border-[#FF5C39] transition-all duration-200 disabled:opacity-50 placeholder:text-[#A1A1AA] shadow-inner"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 w-10 h-10 flex items-center justify-center bg-[#FF5C39] text-white hover:bg-[#E84B1A] disabled:bg-[#E9ECEF] disabled:text-[#A1A1AA] rounded-xl transition-all duration-200 shadow-[0_4px_12px_rgba(255,92,57,0.25)] disabled:shadow-none"
            >
              <Send className="w-[18px] h-[18px] ml-[-2px] mt-[1px]" />
            </button>
          </form>
          <div className="text-center mt-4">
            <p className="text-[11px] text-[#A1A1AA] font-mono font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              Secure Neural Link Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
