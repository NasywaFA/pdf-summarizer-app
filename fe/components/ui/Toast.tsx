import React, { useEffect } from "react";

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 3000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: "bg-green-500/90",
    error: "bg-red-500/90",
    info: "bg-blue-500/90",
  };

  return (
    <div
      className={`${colors[type]} text-white px-6 py-4 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-3 min-w-[300px] animate-slide-in`}
    >
      <p className="flex-1">{message}</p>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        ✕
      </button>
    </div>
  );
};
