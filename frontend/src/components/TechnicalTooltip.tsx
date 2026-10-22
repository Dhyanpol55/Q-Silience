import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface TechnicalTooltipProps {
  term: string;
  definition: string;
  formula?: string;
  citation?: string;
  children?: React.ReactNode;
}

export const TechnicalTooltip: React.FC<TechnicalTooltipProps> = ({
  term,
  definition,
  formula,
  citation,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <span
      ref={containerRef}
      className="relative inline-block cursor-help group"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      <span className="underline decoration-dotted decoration-cyan-500/60 underline-offset-4 font-semibold text-slate-800 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors inline-flex items-center gap-1">
        {children || term}
        <HelpCircle className="w-3 h-3 text-cyan-600 dark:text-cyan-400 inline shrink-0 opacity-80 group-hover:opacity-100" />
      </span>

      {isOpen && (
        <span
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 sm:w-80 p-3.5 rounded-xl border shadow-xl text-left font-sans text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 pointer-events-none transition-all duration-150 animate-in fade-in zoom-in-95"
        >
          <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1 text-xs">
            {term}
          </span>
          <span className="text-xs leading-relaxed block text-slate-700 dark:text-slate-300">
            {definition}
          </span>
          {formula && (
            <span className="block mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px] text-cyan-700 dark:text-cyan-300 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-md">
              {formula}
            </span>
          )}
          {citation && (
            <span className="block mt-1 text-[10px] text-slate-500 dark:text-slate-400 italic">
              Standard: {citation}
            </span>
          )}
          {/* Tooltip beak/arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-900" />
        </span>
      )}
    </span>
  );
};
