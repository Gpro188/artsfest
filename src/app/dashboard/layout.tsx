import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import DashboardSidebar from "./DashboardSidebar";
import TourWrapper from "@/components/TourWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const settings = await getSettings(session.user.eventId);

  const { role, username } = session.user;

  return (
    <div className="dashboard-container">
      <DashboardSidebar 
        role={role} 
        username={username} 
        festName={settings.festName} 
        festMoto={settings.festMoto} 
      />

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          {children}
        </div>
      </main>

      {/* Onboarding Tour - auto-detects page from URL */}
      <TourWrapper />
    </div>
  );
}
