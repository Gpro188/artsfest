import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getSettings, getHomepageSettings } from "@/lib/settings";
import DashboardSidebar from "./DashboardSidebar";
import TourWrapper from "@/components/TourWrapper";

import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const session = await getServerSession(authOptions);
  
  if (!session) return {};

  let eventId = session.user.eventId;
  
  if (session.user.role === "MANAGER") {
    const team = await prisma.team.findUnique({
      where: { managerId: session.user.id },
      include: { event: true }
    });
    if (team) {
      eventId = team.event.parentId || team.eventId;
    }
  }

  const settings = await getSettings(eventId);
  const festName = session.user.role === "SUPER_ADMIN" ? "Artsfest Central" : settings.festName;

  return {
    title: {
      template: `%s | ${festName}`,
      default: `${festName} | Admin Dashboard`,
    },
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const { role, username } = session.user;

  let teamName: string | undefined = undefined;
  let eventId = session.user.eventId;
  
  if (role === "MANAGER") {
    const team = await prisma.team.findUnique({
      where: { managerId: session.user.id },
      include: { event: true }
    });
    if (team) {
      teamName = team.name;
      eventId = team.event.parentId || team.eventId; // Fallback to event context
    }
  }

  const settings = await getSettings(eventId);
  const homepageSettings = eventId ? await getHomepageSettings(eventId) : null;

  return (
    <div className="dashboard-container">
      <DashboardSidebar 
        role={role} 
        username={username} 
        festName={role === "SUPER_ADMIN" ? "Artsfest Central" : settings.festName} 
        festMoto={role === "SUPER_ADMIN" ? "System Administration" : settings.festMoto} 
        festLogo={role !== "SUPER_ADMIN" ? settings.festLogo : undefined}
        teamName={teamName}
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
