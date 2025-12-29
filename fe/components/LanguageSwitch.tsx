interface LanguageSwitchProps {
  language: "EN" | "ID" | "CN" | "JP" | "KR";
  onLanguageChange: (lang: "EN" | "ID" | "CN" | "JP" | "KR") => void;
}

export default function LanguageSwitch({language, onLanguageChange,
}: LanguageSwitchProps) {
  return (
    <div className="flex justify-center mb-8 sticky top-4 z-50">
      <div className="inline-flex gap-1 bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20">
        <button
          onClick={() => onLanguageChange("EN")}
          className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
            language === "EN"
              ? "bg-white text-[#302b63] shadow-lg shadow-white/30"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          EN
        </button>
        <button
          onClick={() => onLanguageChange("ID")}
          className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
            language === "ID"
              ? "bg-white text-[#302b63] shadow-lg shadow-white/30"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          ID
        </button>
        <button
          onClick={() => onLanguageChange("CN")}
          className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
            language === "CN"
              ? "bg-white text-[#302b63] shadow-lg shadow-white/30"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          CN
        </button>
        <button
          onClick={() => onLanguageChange("JP")}
          className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
            language === "JP"
              ? "bg-white text-[#302b63] shadow-lg shadow-white/30"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          JP
        </button>
        <button
          onClick={() => onLanguageChange("KR")}
          className={`px-6 py-2 rounded-full font-semibold text-sm transition-all duration-300 ${
            language === "KR"
              ? "bg-white text-[#302b63] shadow-lg shadow-white/30"
              : "text-white/60 hover:text-white/80"
          }`}
        >
          KR
        </button>
      </div>
    </div>
  );
}
