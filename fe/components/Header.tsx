'use client';

import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-[#4a1420]/60 backdrop-blur-md border-b border-white/10 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">PDF Summarizer</h1>
        <div className="text-sm text-white/70">AI-Powered Document Analysis</div>
      </div>
    </header>
  );
};