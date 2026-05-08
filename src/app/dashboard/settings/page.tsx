import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";
import PendingList from "./PendingList";
import MaintenanceActions from "./MaintenanceActions";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const settings = await getSettings();

  // Fetch Pending Assignments
  // A program is "pending" if it has fewer assignments than expected or 0 assignments
  const programs = await prisma.program.findMany({
    include: {
      _count: { select: { assignments: true } },
      category: true,
      event: true
    }
  });

  const teams = await prisma.team.findMany({
    include: {
      _count: { select: { candidates: true } },
      candidates: {
        include: { 
          _count: { select: { programs: true } },
          programs: true
        }
      }
    }
  });

  return (
    <div className="animate-fade-in">
      <h1 style={{ marginBottom: 'var(--spacing-lg)' }}>System Settings & Audit</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-xl)' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>General Configuration</h2>
          <SettingsForm initialSettings={settings} />
        </div>

        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Program Assignment Audit (Pending List)</h2>
          <PendingList programs={programs as any} teams={teams as any} />
        </div>

        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem', color: 'var(--error)' }}>Data Management & Maintenance</h2>
          <MaintenanceActions />
        </div>
      </div>
    </div>
  );
}
