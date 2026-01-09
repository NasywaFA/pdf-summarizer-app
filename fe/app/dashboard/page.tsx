import { Header } from '@/components/Header';
import { PDFSummarizer } from '@/components/PDFSummarizer';

export default function DashboardPage() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <PDFSummarizer />
    </div>
  );
}