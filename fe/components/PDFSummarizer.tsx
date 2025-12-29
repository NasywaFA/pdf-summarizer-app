'use client';

import { useState } from 'react';
import Header from './Header';
import LanguageSwitch from './LanguageSwitch' ;
import UploadSection from './UploadSection';
import SummarySection from './SummarySection';

export type SummaryStyle = 'professional' | 'simple';

export default function PDFSummarizer() {
  const [language, setLanguage] = useState<'EN' | 'ID' | "CN" | "JP" | "KR">('EN');
  const [summaryStyle, setSummaryStyle] = useState<SummaryStyle>('professional');
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSummarize = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setSummary('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', language);
      formData.append('style', summaryStyle);

      const response = await fetch('http://localhost:8000/summarize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3a0f1a] via-[#6b1f2e] to-[#4a0f1a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <LanguageSwitch language={language} onLanguageChange={setLanguage} />
        <Header />
        <UploadSection
          file={file}
          onFileChange={setFile}
          summaryStyle={summaryStyle}
          onStyleChange={setSummaryStyle}
          onSummarize={handleSummarize}
          loading={loading}
          error={error}
        />
        <SummarySection summary={summary} fileName={file?.name} />
      </div>
    </div>
  );
}