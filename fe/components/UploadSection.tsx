import { SummaryStyle } from "./PDFSummarizer";

interface UploadSectionProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  summaryStyle: SummaryStyle;
  onStyleChange: (style: SummaryStyle) => void;
  onSummarize: () => void;
  loading: boolean;
  error: string;
}

export default function UploadSection({
  file,
  onFileChange,
  summaryStyle,
  onStyleChange,
  onSummarize,
  loading,
  error,
}: UploadSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "application/pdf") {
      onFileChange(selectedFile);
    }
  };
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 shadow-2xl">
      <h3 className="text-white text-2xl font-bold mb-6">Upload Your PDF</h3>

      <div className="border-2 border-dashed border-[#667eea]/50 rounded-2xl p-8 mb-6 bg-white/5">
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="pdf-upload"
        />
        <label
          htmlFor="pdf-upload"
          className="block text-center cursor-pointer"
        >
          <div className="text-white/70 mb-2">
            {file ? file.name : "Choose a PDF file"}
          </div>
          <div className="text-white/50 text-sm">
            Upload a PDF document to generate an AI-powered summary
          </div>
        </label>
      </div>

      {file && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mb-4">
          <p className="text-green-400 font-semibold">
            {file.name} uploaded successfully!
          </p>
          <p className="text-white/60 text-sm mt-1">
            File size: {(file.size / 1024).toFixed(2)} KB
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Summary Style Selector */}
      <div className="mb-6">
        <label className="text-white/80 text-sm font-medium mb-3 block">
          Summary Style
        </label>
        <div className="flex gap-3">
          <button
            onClick={() => onStyleChange("professional")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
              summaryStyle === "professional"
                ? "bg-gradient-to-r from-[#d16ba5] via-[#e07a9b] to-[#f4978e] text-white shadow-lg"
                : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
            }`}
          >
            Professional
          </button>
          <button
            onClick={() => onStyleChange("simple")}
            className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
              summaryStyle === "simple"
                ? "bg-gradient-to-r from-[#d16ba5] via-[#e07a9b] to-[#f4978e] text-white shadow-lg"
                : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/10"
            }`}
          >
            Simple
          </button>
        </div>
        <p className="text-white/50 text-xs mt-2">
          {summaryStyle === "professional"
            ? "Formal executive summary with detailed sections"
            : "Easy-to-read summary in casual language"}
        </p>
      </div>

      <button
        onClick={onSummarize}
        disabled={!file || loading}
        className="w-full bg-gradient-to-r from-[#d16ba5] via-[#e07a9b] to-[#f4978e] text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg shadow-[#e07a9b]/40 hover:shadow-[#e07a9b]/60 hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            AI is analyzing...
          </span>
        ) : (
          "Generate Summary"
        )}
      </button>
    </div>
  );
}
