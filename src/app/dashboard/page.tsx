import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CustomerGuidelines from "./CustomerGuidelines";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  const { role, id: userId, eventId, username } = session.user;

  let stats: { label: string; value: string | number; icon: string; color: string }[] = [];
  let userTeam: any = null;
  let hasTeam = false;

  if (role === "MANAGER") {
    // Look up this manager's team
    userTeam = await prisma.team.findUnique({
      where: { managerId: userId },
      select: {
        id: true,
        name: true,
        eventId: true,
        event: {
          select: {
            name: true
          }
        }
      }
    });

    if (userTeam) {
      hasTeam = true;
      const teamId = userTeam.id;

      // Fetch team-specific stats
      const [
        candidatesCount,
        approvedCandidatesCount,
        assignmentsCount,
        teamResults
      ] = await Promise.all([
        prisma.candidate.count({ where: { teamId } }),
        prisma.candidate.count({ where: { teamId, isApproved: true } }),
        prisma.programAssignment.count({ where: { candidate: { teamId } } }),
        prisma.result.findMany({
          where: {
            OR: [
              { teamId },
              { candidate: { teamId } }
            ]
          },
          select: {
            points: true,
            isPublished: true
          }
        })
      ]);

      const publishedPoints = teamResults
        .filter(r => r.isPublished)
        .reduce((sum, r) => sum + r.points, 0);
      
      const totalPoints = teamResults
        .reduce((sum, r) => sum + r.points, 0);

      stats = [
        { label: "Your Team", value: userTeam.name, icon: "🛡️", color: "#6366f1" },
        { label: "Candidates Registered", value: candidatesCount, icon: "👤", color: "#ec4899" },
        { label: "Approved Candidates", value: `${approvedCandidatesCount} / ${candidatesCount}`, icon: "✅", color: "#10b981" },
        { label: "Program Entries", value: assignmentsCount, icon: "📜", color: "#f59e0b" },
        { label: "Points Published", value: publishedPoints, icon: "🏆", color: "#8b5cf6" },
        { label: "Total Points", value: totalPoints, icon: "✨", color: "#e11d48" },
      ];
    }
  } else {
    // For admins, judges, and media, query event-scoped or global statistics
    const eventIdFilter = eventId ? { eventId } : undefined;

    const [
      eventsCount,
      teamsCount,
      programsCount,
      participantsCount,
      publishedResults,
      pendingResults
    ] = await Promise.all([
      eventId ? Promise.resolve(1) : prisma.event.count(),
      prisma.team.count({ where: eventIdFilter }),
      prisma.program.count({ where: eventIdFilter }),
      prisma.candidate.count({
        where: {
          team: eventId ? { eventId } : undefined,
          programs: { some: {} }
        }
      }),
      prisma.result.count({
        where: {
          isPublished: true,
          program: eventId ? { eventId } : undefined
        }
      }),
      prisma.result.count({
        where: {
          isPublished: false,
          program: eventId ? { eventId } : undefined
        }
      })
    ]);

    stats = [
      { label: "Total Events", value: eventsCount, icon: "🎭", color: "#6366f1" },
      { label: "Active Teams", value: teamsCount, icon: "🛡️", color: "#ec4899" },
      { label: "Programmes", value: programsCount, icon: "📜", color: "#f59e0b" },
      { label: "Participants", value: participantsCount, icon: "👤", color: "#10b981" },
      { label: "Results Published", value: publishedResults, icon: "🏆", color: "#8b5cf6" },
      { label: "Results Pending", value: pendingResults, icon: "⏳", color: "#ef4444" },
    ];
  }

  // Handle Team Manager without team setup
  if (role === "MANAGER" && !hasTeam) {
    return (
      <div className="animate-fade-in" style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: 'var(--spacing-xxl)', maxWidth: '600px', margin: '0 auto', border: '1px solid var(--warning)' }}>
          <h2 style={{ color: 'var(--warning)', marginBottom: 'var(--spacing-md)' }}>⚠️ Account Setup Pending</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', fontSize: '1rem' }}>
            Welcome, <strong>{username}</strong>. You are currently logged in as a Team Manager, but your account has not been assigned to a participating team yet.
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Please contact your festival administrator to link your user profile with your designated team. Once assigned, you can begin registering candidates, managing program entries, and printing team schedules.
          </p>
        </div>
      </div>
    );
  }

  // Quick Action Links config
  const quickLinks: { label: string; href: string }[] = [];
  if (role === "ADMIN") {
    quickLinks.push(
      { label: "Results Entry", href: "/dashboard/scoring" },
      { label: "Manage Schedule", href: "/dashboard/schedule" }
    );
  } else if (role === "MANAGER" && hasTeam) {
    quickLinks.push(
      { label: "Register Candidates", href: "/dashboard/candidates" },
      { label: "View Assignments", href: "/dashboard/assignments" },
      { label: "Print Schedule", href: "/dashboard/schedule" }
    );
  } else if (role === "MEDIA") {
    quickLinks.push(
      { label: "Poster Branding", href: "/dashboard/media" },
      { label: "Live Hub", href: "/hub" }
    );
  } else if (role === "JUDGE") {
    quickLinks.push(
      { label: "Results Entry", href: "/dashboard/scoring" }
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ margin: 0 }}>
          {role === "MANAGER" ? "Team Dashboard" : "Management Overview"}
        </h1>
        <div data-tour="dash-hub-btn" style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
           <Link href="/hub" className="btn btn-primary" style={{ backgroundColor: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Live Management Hub
           </Link>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div data-tour="dash-stats" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 'var(--spacing-lg)',
        marginBottom: 'var(--spacing-xxl)'
      }}>
        {stats.map((stat, i) => (
          <div key={i} className="glass-panel" style={{ 
            padding: 'var(--spacing-lg)', 
            borderLeft: `4px solid ${stat.color}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '120px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {stat.label}
              </span>
              <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '4px', color: 'white' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
        <div data-tour="dash-welcome" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Welcome Back</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 'var(--spacing-md)' }}>
            {role === "MANAGER" ? (
              <>
                You are currently logged in as <strong>{username}</strong>, managing team <strong>{userTeam?.name}</strong> for <strong>{userTeam?.event?.name}</strong>. 
                All functions for registration and scheduling are available below.
              </>
            ) : (
              <>
                You are currently logged in as <strong>{username}</strong> with administrative privileges. 
                All system operations are running normally.
              </>
            )}
          </p>
          {quickLinks.length > 0 && (
            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
               {quickLinks.map((link, idx) => (
                 <Link key={idx} href={link.href} className="btn btn-secondary">
                   {link.label}
                 </Link>
               ))}
            </div>
          )}
        </div>

        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Manager Resources</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontSize: '0.85rem' }}>
            External tools for candidate photo hosting:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <a href="https://imgbb.com" target="_blank" className="btn btn-secondary" style={{ textAlign: 'left', fontSize: '0.8rem' }}>🚀 ImgBB (Recommended)</a>
            <a href="https://postimages.org" target="_blank" className="btn btn-secondary" style={{ textAlign: 'left', fontSize: '0.8rem' }}>🖼️ PostImages</a>
          </div>
        </div>
      </div>

      <CustomerGuidelines role={role} />
    </div>
  );
}

