'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="relative flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 border border-slate-700/60 dark:border-slate-800 light:border-slate-300 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:border-purple-500/60 transition-all duration-300 shadow-sm group"
      style={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(241, 245, 249, 0.9)',
        borderColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(203, 213, 225, 0.9)',
        color: isDark ? '#e2e8f0' : '#1e293b'
      }}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold font-mono">
        <motion.div
          initial={false}
          animate={{ rotate: isDark ? 0 : 360, scale: isDark ? 1 : 0.9 }}
          transition={{ duration: 0.4, ease: 'backOut' }}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-purple-400" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-amber-500" />
          )}
        </motion.div>
        <span className="hidden sm:inline text-[11px] uppercase tracking-wider font-semibold">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </div>

      {/* Pill Toggle Slider Visual Indicator */}
      <div 
        className="w-7 h-4 rounded-full p-0.5 relative transition-colors duration-300"
        style={{
          backgroundColor: isDark ? 'rgba(124, 58, 237, 0.3)' : 'rgba(245, 158, 11, 0.25)'
        }}
      >
        <motion.div
          className="w-3 h-3 rounded-full shadow-sm"
          style={{
            backgroundColor: isDark ? '#c084fc' : '#f59e0b'
          }}
          animate={{
            x: isDark ? 0 : 12
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
