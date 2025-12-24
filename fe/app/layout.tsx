import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PDF AI Summarizer',
  description: 'Summarize PDF documents with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}