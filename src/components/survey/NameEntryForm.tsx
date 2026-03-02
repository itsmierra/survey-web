"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NameEntryFormProps {
  surveyTitle: string;
  onSubmit: (name: string) => void;
  error: string | null;
}

export function NameEntryForm({ surveyTitle, onSubmit, error }: NameEntryFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="animate-fade-in-up">
      <div className="glass-card rounded-2xl shadow-lg overflow-hidden">
        <div className="gradient-bg px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white">{surveyTitle}</h2>
          <p className="text-sm text-white/80 mt-2">설문에 참여해주셔서 감사합니다</p>
        </div>
        <div className="px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                이름을 입력해주세요
              </label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                required
                autoFocus
                className="h-12 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors text-base dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-700"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full h-12 rounded-xl gradient-bg text-white hover:opacity-90 shadow-md text-base font-semibold"
              disabled={!name.trim()}
            >
              설문 시작하기
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
