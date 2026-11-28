"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";
import ThemeToggle from "@/app/components/ThemeToggle";
import {
  LayoutDashboard,
  Radio,
  CalendarDays,
  Shield,
  UserCircle,
  FileText,
  ClipboardList,
  Trophy,
  BarChart3,
  Clock,
  Palette,
  Settings,
  Home,
  Printer,
  Menu,
  X,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface SidebarProps {
  role: string;
  username: string;
  festName: string;
  festMoto: string;
  festLogo?: string | null;
  teamName?: string;
}

interface NavItem {
  name: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
  highlight?: boolean;
}

function getNavItems(role: string): { section: string; items: NavItem[] }[] {
  const groups: { section: string; items: NavItem[] }[] = [];

  // Always shown
  groups.push({
    section: "Overview",
    items: [
      {
        name: "Dashboard",
        subtitle: "Overview & quick stats",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        name: "Live Hub",
        subtitle: "Real-time public standings",
        icon: Radio,
        href: "/hub",
        highlight: true,
      },
    ],
  });

  if (["ADMIN", "SUPER_ADMIN"].includes(role)) {
    groups.push({
      section: "Admin Setup",
      items: [
        {
          name: "Events",
          subtitle: "Create & manage festival events",
          icon: CalendarDays,
          href: "/dashboard/events",
        },
        {
          name: "Teams",
          subtitle: "Teams, managers & flag colors",
          icon: Shield,
          href: "/dashboard/teams",
        },
        {
          name: "Candidates",
          subtitle: "Register & approve participants",
          icon: UserCircle,
          href: "/dashboard/candidates",
        },
        {
          name: "Programs",
          subtitle: "Competition programs & rules",
          icon: FileText,
          href: "/dashboard/programs",
        },
        {
          name: "Program Assignments",
          subtitle: "Enroll candidates into programs",
          icon: ClipboardList,
          href: "/dashboard/assignments",
        },
        {
          name: "Results & Scoring",
          subtitle: "Enter marks & publish results",
          icon: Trophy,
          href: "/dashboard/scoring",
        },
        {
          name: "Reports Hub",
          subtitle: "Hall of Fame, PDF & Excel",
          icon: BarChart3,
          href: "/dashboard/reports",
          highlight: true,
        },
        {
          name: "Global Schedule",
          subtitle: "Timeline & venue planning",
          icon: Clock,
          href: "/dashboard/schedule",
        },
        {
          name: "Media Branding",
          subtitle: "Posters, logos & branding",
          icon: Palette,
          href: "/dashboard/media",
          highlight: true,
        },
        {
          name: "Settings",
          subtitle: "Config, audit & maintenance",
          icon: Settings,
          href: "/dashboard/settings",
        },
        {
          name: "Homepage & Theme",
          subtitle: "Colors, hero & committee",
          icon: Home,
          href: "/dashboard/settings/homepage",
        },
      ],
    });
  }

  if (role === "MEDIA") {
    groups.push({
      section: "Media Center",
      items: [
        {
          name: "Poster Branding",
          subtitle: "Design result posters",
          icon: Palette,
          href: "/dashboard/media",
          highlight: true,
        },
        {
          name: "View Results",
          subtitle: "Browse published results",
          icon: Trophy,
          href: "/dashboard/scoring",
        },
      ],
    });
  }

  if (role === "MANAGER") {
    groups.push({
      section: "Team Manager",
      items: [
        {
          name: "Candidates",
          subtitle: "Register your team's participants",
          icon: UserCircle,
          href: "/dashboard/candidates",
        },
        {
          name: "Program Assignments",
          subtitle: "Enroll candidates in programs",
          icon: ClipboardList,
          href: "/dashboard/assignments",
        },
        {
          name: "Fest Reports",
          subtitle: "Standings, points & PDF prints",
          icon: BarChart3,
          href: "/dashboard/reports",
        },
        {
          name: "Print Schedule",
          subtitle: "View & print team timetable",
          icon: Printer,
          href: "/dashboard/schedule",
        },
      ],
    });
  }

  return groups;
}

function roleColor(role: string) {
  switch (role) {
    case "SUPER_ADMIN":
      return "#f59e0b";
    case "ADMIN":
      return "#6366f1";
    case "JUDGE":
      return "#10b981";
    case "MEDIA":
      return "#0ea5e9";
    case "MANAGER":
      return "#f43f5e";
    default:
      return "#98a2b3";
  }
}

export default function DashboardSidebar({
  role,
  username,
  festName,
  festMoto,
  festLogo,
  teamName,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [popout, setPopout] = useState<{
    section: string;
    items: NavItem[];
    activeHref: string;
    top: number;
  } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  const toggle = () => setIsOpen(!isOpen);
  const close = () => {
    setIsOpen(false);
    setPopout(null);
  };

  const isActive = useCallback(
    (href: string) => {
      if (href === "/dashboard") return pathname === "/dashboard";
      return pathname.startsWith(href);
    },
    [pathname]
  );

  const handleItemMouseEnter = (
    e: React.MouseEvent<HTMLElement>,
    section: string,
    items: NavItem[],
    itemHref: string
  ) => {
    if (isExpanded || isOpen) return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    const maxTop = typeof window !== "undefined" ? window.innerHeight - Math.min(items.length * 52 + 64, 420) : rect.top;
    setPopout({
      section,
      items,
      activeHref: itemHref,
      top: Math.max(12, Math.min(rect.top - 8, maxTop)),
    });
  };

  const scheduleClosePopout = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setPopout(null);
    }, 140);
  };

  const cancelClosePopout = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const navGroups = getNavItems(role);
  const showFull = isExpanded || isOpen;

  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Logo Area */}
      <div className={`sidebar-logo-area ${!showFull ? "compact" : ""}`}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: showFull ? "space-between" : "center",
            gap: "0.625rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: festLogo ? "transparent" : "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: festLogo ? "none" : "0 2px 8px rgba(99,102,241,0.35)",
              }}
            >
              <img
                src={festLogo || "/logo.png"}
                alt="Logo"
                style={{ width: festLogo ? "100%" : "24px", height: festLogo ? "100%" : "24px", objectFit: "contain", borderRadius: "10px" }}
              />
            </div>
            {showFull && (
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {festName}
                </div>
                <div
                  style={{
                    fontSize: "0.65rem",
                    color: "var(--text-muted)",
                    marginTop: "2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {festMoto}
                </div>
              </div>
            )}
          </div>

          {showFull && !isOpen && (
            <button
              onClick={() => setIsExpanded(false)}
              className="sidebar-collapse-btn"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {!showFull && (
          <button
            onClick={() => setIsExpanded(true)}
            className="sidebar-collapse-btn compact-expand-btn"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
      </div>

      {/* User Area */}
      <div className={`sidebar-user-area ${!showFull ? "compact" : ""}`}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: showFull ? "flex-start" : "center",
            gap: "0.625rem",
          }}
          title={!showFull ? `${username} (${role.replace("_", " ")})` : undefined}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${roleColor(role)}, ${roleColor(role)}aa)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: "white",
              boxShadow: `0 2px 8px ${roleColor(role)}40`,
            }}
          >
            {username.charAt(0).toUpperCase()}
          </div>
          {showFull && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {username}
              </div>
              <div style={{ marginTop: "2px" }}>
                <span className="role-badge">{role.replace("_", " ").toLowerCase()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav no-scrollbar">
        {navGroups.map((group, groupIdx) => (
          <div key={group.section}>
            {showFull ? (
              <div className="nav-section-title">{group.section}</div>
            ) : (
              groupIdx > 0 && <div className="nav-rail-divider" />
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  onMouseEnter={(e) => handleItemMouseEnter(e, group.section, group.items, item.href)}
                  onMouseLeave={scheduleClosePopout}
                  className={`nav-link-wrapper ${active ? "active" : ""} ${!showFull ? "compact" : ""}`}
                  style={
                    showFull && item.highlight && !active
                      ? { borderLeftColor: "rgba(14,165,233,0.35)" }
                      : undefined
                  }
                >
                  <div className="nav-icon">
                    <item.icon size={18} strokeWidth={2} />
                  </div>
                  {showFull && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span
                        className="nav-link-main"
                        style={
                          item.highlight && !active
                            ? { color: "#0ea5e9", fontWeight: 600 }
                            : undefined
                        }
                      >
                        {item.name}
                      </span>
                      <span className="nav-link-subtitle">{item.subtitle}</span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="sidebar-footer"
        style={{
          display: "flex",
          flexDirection: showFull ? "row" : "column",
          alignItems: "center",
          justifyContent: showFull ? "space-between" : "center",
          gap: "0.625rem",
          padding: showFull ? "0.875rem 1.25rem" : "0.75rem 0.5rem",
        }}
      >
        <LogoutButton compact={!showFull} />
        <ThemeToggle />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <header className="mobile-header no-print">
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img src="/logo.png" alt="" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
            {festName}
          </span>
        </div>
        <button onClick={toggle} className="burger-btn" aria-label="Toggle menu">
          {isOpen ? <X size={22} strokeWidth={2.5} /> : <Menu size={22} strokeWidth={2.5} />}
        </button>
      </header>

      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={close} />}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar no-print ${isExpanded ? "expanded" : "collapsed"} ${isOpen ? "open" : ""}`}>
        <SidebarContent />
      </aside>

      {/* Floating Pop-out Menu (Desktop minimal rail) */}
      {!showFull && popout && (
        <div
          className="sidebar-popout no-print"
          style={{ top: `${popout.top}px` }}
          onMouseEnter={cancelClosePopout}
          onMouseLeave={scheduleClosePopout}
        >
          <div className="sidebar-popout-header">{popout.section}</div>
          <div className="sidebar-popout-list">
            {popout.items.map((item) => {
              const active = isActive(item.href);
              const hovered = popout.activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className={`sidebar-popout-item ${active ? "active" : ""} ${hovered ? "hovered" : ""}`}
                >
                  <div className="sidebar-popout-icon">
                    <item.icon size={16} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="sidebar-popout-title">{item.name}</div>
                    <div className="sidebar-popout-sub">{item.subtitle}</div>
                  </div>
                  <ChevronRight size={14} className="sidebar-popout-arrow" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
