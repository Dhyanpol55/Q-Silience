import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';

interface TechnicalTooltipProps {
  term: string;
  definition: string;
  formula?: string;
  citation?: string;
  children?: React.ReactNode;
  defaultPlacement?: 'top' | 'bottom' | 'auto';
}

export const TechnicalTooltip: React.FC<TechnicalTooltipProps> = ({
  term,
  definition,
  formula,
  citation,
  children,
  defaultPlacement = 'bottom',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>(
    defaultPlacement === 'auto' ? 'bottom' : defaultPlacement
  );
  const [align, setAlign] = useState<'center' | 'left' | 'right'>('center');
  const containerRef = useRef<HTMLSpanElement>(null);

  const calculatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Vertical placement: default to bottom when near top of viewport (< 220px)
    if (defaultPlacement === 'auto' || defaultPlacement === 'bottom') {
      if (rect.top < 220) {
        setPlacement('bottom');
      } else if (viewportHeight - rect.bottom < 220) {
        setPlacement('top');
      } else {
        setPlacement(defaultPlacement === 'auto' ? 'bottom' : defaultPlacement);
      }
    } else {
      // defaultPlacement === 'top'
      if (rect.top < 220) {
        setPlacement('bottom');
      } else {
        setPlacement('top');
      }
    }

    // Horizontal alignment: clamp if near left or right viewport edges
    const tooltipWidth = Math.min(380, viewportWidth - 32);
    const halfWidth = tooltipWidth / 2;

    if (rect.left + rect.width / 2 < halfWidth + 16) {
      setAlign('left');
    } else if (viewportWidth - (rect.left + rect.width / 2) < halfWidth + 16) {
      setAlign('right');
    } else {
      setAlign('center');
    }
  }, [defaultPlacement]);

  const handleOpen = () => {
    calculatePosition();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Alignment CSS classes
  const alignClass =
    align === 'left'
      ? 'left-0'
      : align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  // Placement CSS classes
  const placementClass =
    placement === 'bottom'
      ? 'top-full mt-2.5'
      : 'bottom-full mb-2.5';

  return (
    <span
      ref={containerRef}
      className="relative inline-block cursor-help group"
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
      onFocus={handleOpen}
      onBlur={handleClose}
      onClick={handleToggle}
    >
      <span className="underline decoration-dotted decoration-cyan-500/70 underline-offset-4 font-semibold text-slate-800 dark:text-slate-100 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors inline-flex items-center gap-1">
        {children || term}
        <HelpCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 inline shrink-0 opacity-80 group-hover:opacity-100" />
      </span>

      {isOpen && (
        <span
          role="tooltip"
          className={`absolute z-50 ${placementClass} ${alignClass} p-4 rounded-xl border shadow-2xl text-left font-sans text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 pointer-events-auto transition-all duration-150 animate-in fade-in zoom-in-95`}
          style={{ width: 'min(380px, calc(100vw - 2rem))' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="font-bold text-cyan-600 dark:text-cyan-400 block mb-1.5 text-xs sm:text-sm">
            {term}
          </span>
          <span className="text-xs leading-relaxed block text-slate-700 dark:text-slate-300 break-words whitespace-normal">
            {definition}
          </span>
          {formula && (
            <span className="block mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono text-[11px] sm:text-xs text-cyan-700 dark:text-cyan-300 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg break-words whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {formula}
            </span>
          )}
          {citation && (
            <span className="block mt-2 text-[10px] text-slate-500 dark:text-slate-400 italic break-words">
              Reference: {citation}
            </span>
          )}
        </span>
      )}
    </span>
  );
};
