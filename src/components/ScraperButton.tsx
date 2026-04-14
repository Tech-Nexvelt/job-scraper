"use client";

import React, { useState } from 'react';
import { RefreshCcw, CheckCircle2, AlertCircle } from 'lucide-react';

export const ScraperButton = ({ isCollapsed }: { isCollapsed?: boolean }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSync = async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/scrape/run', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.status === 'success') {
        setStatus('success');
        setMessage('Scraper Triggered!');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to trigger');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      setStatus('error');
      setMessage('Network Error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className={isCollapsed ? "px-2 py-3" : "px-4 py-3"}>
      <button
        onClick={handleSync}
        disabled={status === 'loading'}
        title="Sync Daily Jobs"
        className={`
          w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300
          ${status === 'idle' ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20' : ''}
          ${status === 'loading' ? 'bg-slate-800 text-slate-400 cursor-wait' : ''}
          ${status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : ''}
          ${status === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' : ''}
          ${isCollapsed ? 'px-0 py-2.5' : ''}
        `}
      >
        <RefreshCcw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
        {!isCollapsed && (
          <span>
            {status === 'idle' && "Sync Daily Jobs"}
            {status === 'loading' && "Connecting..."}
            {status === 'success' && "Run Started!"}
            {status === 'error' && "Check Token"}
          </span>
        )}
      </button>
      
      {status === 'error' && message && (
        <p className="mt-2 text-[10px] text-rose-400/70 text-center leading-tight">
          {message}
        </p>
      )}
    </div>
  );
};
