import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CustomerGuidelines from "./CustomerGuidelines";
import { getFestivalEventIds } from "@/lib/eventScope";
import DashboardIcons from "./DashboardIcons";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const { role, id: userId, eventId, username } = session.user;

  let stats: {
    label: string;
    value: string | number;
    iconKey: string;
    accentStart: string;
    accentEnd: string;
    trend?: string;
  }[] = [];
  let userTeam: any = null;
  let hasTeam = false;

  if (role === "MANAGER") {
    userTeam = await prisma.team.findUnique({
      where: { managerId: userId },
      select: {
        id: true,
        name: true,
        eventId: true,
        event: { select: { name: true } },
      },
    });

    if (userTeam) {
      hasTeam = true;
      const teamId = userTeam.id;

      const [
        candidatesCount,
        approvedCandidatesCount,
        assignmentsCount,
        teamResults,
      ] = await Promise.all([
        prisma.candidate.count({ where: { teamId } }),
        prisma.candidate.count({ where: { teamId, isApproved: true } }),
        prisma.programAssignment.count({
          where: { candidate: { teamId } },
        }),
        prisma.result.findMany({
          where: { OR: [{ teamId }, { candidate: { teamId } }] },
          select: { points: true, isPublished: true },
        }),
      ]);

      const publishedPoints = teamResults
        .filter((r) => r.isPublished)
        .reduce((sum, r) => sum + r.points, 0);
      const totalPoints = teamResults.reduce((sum, r) => sum + r.points, 0);

      stats = [
        {
          label: "Your Team",
          value: userTeam.name,
          iconKey: "shield",
          accentStart: "#6366f1",
          accentEnd: "#818cf8",
        },
        {
          label: "Candidates",
          value: candidatesCount,
          iconKey: "user-circle",
          accentStart: "#ec4899",
          accentEnd: "#f472b6",
        },
        {
          label: "Approved",
          value: `${approvedCandidatesCount} / ${candidatesCount}`,
          iconKey: "check-circle",
          accentStart: "#10b981",
          accentEnd: "#34d399",
        },
        {
          label: "Program Entries",
          value: assignmentsCount,
          iconKey: "file-text",
          accentStart: "#f59e0b",
          accentEnd: "#fbbf24",
        },
        {
          label: "Points Published",
          value: publishedPoints,
          iconKey: "trophy",
          accentStart: "#8b5cf6",
          accentEnd: "#a78bfa",
        },
        {
          label: "Total Points",
          value: totalPoints,
          iconKey: "sparkles",
          accentStart: "#e11d48",
          accentEnd: "#fb7185",
        },
      ];
    }
  } else {
    const festEventIds = eventId ? await getFestivalEventIds(eventId) : [];
    const eventIdFilter = festEventIds.length > 0 ? { eventId: { in: festEventIds } } : (eventId ? { eventId } : undefined);

    const [
      eventsCount,
      teamsCount,
      programsCount,
      participantsCount,
      publishedResults,
      pendingResults,
    ] = await Promise.all([
      eventId ? Promise.resolve(1) : prisma.event.count(),
      prisma.team.count({ where: eventIdFilter }),
      prisma.program.count({ where: eventIdFilter }),
      prisma.candidate.count({
        where: {
          team: festEventIds.length > 0 ? { eventId: { in: festEventIds } } : (eventId ? { eventId } : undefined),
          programs: { some: {} },
        },
      }),
      prisma.program.count({
        where: {
          ...(festEventIds.length > 0 ? { eventId: { in: festEventIds } } : (eventId ? { eventId } : {})),
          results: { some: { isPublished: true } },
        },
      }),
      prisma.program.count({
        where: {
          ...(festEventIds.length > 0 ? { eventId: { in: festEventIds } } : (eventId ? { eventId } : {})),
          results: { none: { isPublished: true } },
        },
      }),
    ]);

    stats = [
      {
        label: "Total Events",
        value: eventsCount,
        iconKey: "calendar-days",
        accentStart: "#6366f1",
        accentEnd: "#818cf8",
        trend: "Active",
      },
      {
        label: "Active Teams",
        value: teamsCount,
        iconKey: "shield",
        accentStart: "#ec4899",
        accentEnd: "#f472b6",
        trend: "Competing",
      },
      {
        label: "Programmes",
        value: programsCount,
        iconKey: "file-text",
        accentStart: "#f59e0b",
        accentEnd: "#fbbf24",
        trend: "Scheduled",
      },
      {
        label: "Participants",
        value: participantsCount,
        iconKey: "user-circle",
        accentStart: "#10b981",
        accentEnd: "#34d399",
        trend: "Registered",
      },
      {
        label: "Programs Published",
        value: publishedResults,
        iconKey: "trophy",
        accentStart: "#8b5cf6",
        accentEnd: "#a78bfa",
        trend: "Live",
      },
      {
        label: "Programs Pending",
        value: pendingResults,
        iconKey: "clock",
        accentStart: "#ef4444",
        accentEnd: "#f87171",
        trend: "Awaiting",
      },
    ];
  }

  if (role === "MANAGER" && !hasTeam) {
    return (
      <div className="animate-fade-in" style={{ padding: "var(--spacing-xl)" }}>
        <div
          className="stat-card"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
            padding: "3rem",
            "--card-accent-start": "#f59e0b",
            "--card-accent-end": "#fbbf24",
          } as React.CSSProperties}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}><DashboardIcons iconKey="alert-triangle" size={48} /></div>
          <h2 style={{ color: "#d97706", marginBottom: "1rem", fontSize: "1.25rem" }}>
            Account Setup Pending
          </h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", lineHeight: 1.6 }}>
            Welcome, <strong>{username}</strong>. Your account has not been assigned to a
            participating team yet.
          </p>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Please contact your festival administrator to link your profile with your designated
            team.
          </p>
        </div>
      </div>
    );
  }

  const quickLinks: { label: string; href: string; iconKey: string; color: string }[] = [];
  if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
    quickLinks.push(
      { label: "Results Entry", href: "/dashboard/scoring", iconKey: "trophy", color: "#6366f1" },
      { label: "Reports & Hall of Fame", href: "/dashboard/reports", iconKey: "bar-chart", color: "#8b5cf6" },
      { label: "Manage Schedule", href: "/dashboard/schedule", iconKey: "calendar-days", color: "#10b981" },
      { label: "Media Branding", href: "/dashboard/media", iconKey: "palette", color: "#0ea5e9" }
    );
  } else if (role === "MANAGER" && hasTeam) {
    quickLinks.push(
      { label: "Register Candidates", href: "/dashboard/candidates", iconKey: "user-circle", color: "#ec4899" },
      { label: "View Assignments", href: "/dashboard/assignments", iconKey: "clipboard-list", color: "#f59e0b" },
      { label: "Fest Reports", href: "/dashboard/reports", iconKey: "bar-chart", color: "#8b5cf6" },
      { label: "Print Schedule", href: "/dashboard/schedule", iconKey: "printer", color: "#10b981" }
    );
  } else if (role === "MEDIA") {
    quickLinks.push(
      { label: "Poster Branding", href: "/dashboard/media", iconKey: "palette", color: "#0ea5e9" },
      { label: "Live Hub", href: "/hub", iconKey: "radio", color: "#6366f1" }
    );
  } else if (role === "JUDGE") {
    quickLinks.push(
      { label: "Results Entry", href: "/dashboard/scoring", iconKey: "trophy", color: "#6366f1" }
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {role === "MANAGER" ? "Team Dashboard" : "Management Overview"}
          </h1>
          <p className="page-subtitle">
            Welcome back, <strong>{username}</strong> · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div data-tour="dash-hub-btn" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link
            href="/hub"
            className="btn btn-success"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <DashboardIcons iconKey="radio" size={18} /> Live Management Hub
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div
        data-tour="dash-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {stats.map((stat, i) => (
          <div
            key={i}
            className="stat-card"
            style={
              {
                "--card-accent-start": stat.accentStart,
                "--card-accent-end": stat.accentEnd,
              } as React.CSSProperties
            }
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `linear-gradient(135deg, ${stat.accentStart}22, ${stat.accentEnd}33)`,
                  border: `1px solid ${stat.accentStart}33`,
                  color: stat.accentStart,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DashboardIcons iconKey={stat.iconKey} size={22} />
              </div>
              {stat.trend && (
                <span
                  className="badge"
                  style={{
                    background: `${stat.accentStart}15`,
                    color: stat.accentStart,
                    border: `1px solid ${stat.accentStart}25`,
                    fontSize: "0.65rem",
                  }}
                >
                  {stat.trend}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: typeof stat.value === "string" && stat.value.length > 6 ? "1.25rem" : "2rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                lineHeight: 1,
                marginBottom: "0.375rem",
                fontFamily: "var(--font-outfit)",
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Info + Quick Actions Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {/* Welcome Card */}
        <div data-tour="dash-welcome" className="glass-panel" style={{ padding: "var(--spacing-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DashboardIcons iconKey="hand-wave" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Welcome Back</h3>
          </div>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            {role === "MANAGER" ? (
              <>
                Logged in as <strong>{username}</strong>, managing team{" "}
                <strong>{userTeam?.name}</strong> for <strong>{userTeam?.event?.name}</strong>.
              </>
            ) : (
              <>
                Logged in as <strong>{username}</strong> with{" "}
                <strong>{role.replace("_", " ").toLowerCase()}</strong> privileges. All
                system operations are running normally.
              </>
            )}
          </p>
          {quickLinks.length > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {quickLinks.map((link, idx) => (
                <Link
                  key={idx}
                  href={link.href}
                  className="btn btn-sm"
                  style={{
                    background: `${link.color}15`,
                    color: link.color,
                    border: `1px solid ${link.color}30`,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                >
                  <DashboardIcons iconKey={link.iconKey} size={15} />
                  {link.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Manager Resources */}
        <div className="glass-panel" style={{ padding: "var(--spacing-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "1rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <DashboardIcons iconKey="link" size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Manager Resources</h3>
          </div>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.8rem", lineHeight: 1.5 }}>
            External tools for candidate photo hosting:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <a
              href="https://imgbb.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-secondary"
              style={{ justifyContent: "flex-start", gap: "0.5rem" }}
            >
              <DashboardIcons iconKey="external-link" size={14} /> ImgBB <span style={{ color: "var(--text-muted)", fontSize: "0.72rem" }}>(Recommended)</span>
            </a>
            <a
              href="https://postimages.org"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-secondary"
              style={{ justifyContent: "flex-start", gap: "0.5rem" }}
            >
              <DashboardIcons iconKey="image" size={14} /> PostImages
            </a>
          </div>
        </div>
      </div>

      <CustomerGuidelines role={role} />
    </div>
  );
}
