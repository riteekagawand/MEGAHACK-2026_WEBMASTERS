import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";

export default function MedicalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-[#FFFFF4] flex overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-0">
        <DashboardHeader userRole="clinician" />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}