import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { Header } from "@/components/common/Header";
import { StatisticsPanel } from "@/components/dashboard/StatisticsPanel";

export default function SummaryPage() {
  return (
    <ProtectedRoute>
      <Header />
      <main className="page-container">
        <StatisticsPanel />
      </main>
    </ProtectedRoute>
  );
}
