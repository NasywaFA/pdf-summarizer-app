"use client";

import ReactMarkdown from "react-markdown";

interface SummarySectionProps {
  summary: string;
  fileName?: string;
}

export default function SummarySection({
  summary,
  fileName,
}: SummarySectionProps) {
  if (!summary) return null;

  const handleDownload = () => {
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `summary_${fileName || "document"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-2xl">
      <h3 className="text-white text-2xl font-bold mb-6">Summary</h3>

      <div className="bg-white/5 border-2 border-white/10 rounded-2xl p-6 mb-6 text-white/90 prose prose-invert prose-lg max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ node, ...props }) => (
              <h1
                className="text-3xl font-bold text-white mb-4 mt-6"
                {...props}
              />
            ),
            h2: ({ node, ...props }) => (
              <h2
                className="text-2xl font-bold text-white mb-3 mt-5"
                {...props}
              />
            ),
            h3: ({ node, ...props }) => (
              <h3
                className="text-xl font-bold text-white mb-2 mt-4"
                {...props}
              />
            ),
            p: ({ node, ...props }) => (
              <p className="mb-3 leading-relaxed text-white/90" {...props} />
            ),
            strong: ({ node, ...props }) => (
              <strong className="text-yellow-300 font-bold" {...props} />
            ),
            em: ({ node, ...props }) => (
              <em className="text-blue-300" {...props} />
            ),
            ul: ({ node, ...props }) => (
              <ul className="list-disc ml-6 mb-4 space-y-1" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal ml-6 mb-4 space-y-1" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="text-white/90" {...props} />
            ),
            code: ({ node, ...props }) => (
              <code
                className="bg-white/10 px-2 py-1 rounded text-yellow-300"
                {...props}
              />
            ),
          }}
        >
          {summary}
        </ReactMarkdown>
      </div>

      <button
        onClick={handleDownload}
        className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-full border border-white/20 transition-all duration-300"
      >
        Download Summary
      </button>
    </div>
  );
}
