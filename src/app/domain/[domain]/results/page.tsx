import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicDashboard from "../../../components/PublicDashboard";
import VisitTracker from "../../../components/VisitTracker";
import { getSettings, getHomepageSettings } from "@/lib/settings";
import FestHeader from "../../../components/FestHeader";
import type { Metadata } from "next";

export const revalidate = 30; // Revalidate standings every 30 seconds

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const { domain } = await params;
  const decodedDomain = decodeURIComponent(domain);
  const event = await prisma.event.findUnique({ where: { customDomain: decodedDomain } });
  if (!event) return { title: "Results Not Found" };
  
  const globalSetting = await getSettings(event.id);
  const homepage = await getHomepageSettings(event.id);
  const festName = homepage?.heroTitle || globalSetting.festName || event.name;
  const title = `Live Results | ${festName}`;
  
  return {
    title,
    description: `Live leaderboard and standings for ${festName}`,
    icons: globalSetting.festLogo ? { icon: globalSetting.festLogo } : undefined,
  };
}

export default async function FestPage(props: { params: Promise<{ domain: string }> }) {
  const { domain } = await props.params;
  const decodedDomain = decodeURIComponent(domain);

  const event = await prisma.event.findUnique({
    where: { customDomain: decodedDomain },
    include: {
      parent: {
        include: { subEvents: true }
      },
      subEvents: true
    }
  });

  if (!event) {
    notFound();
  }

  // Gather all related events for the dynamic tab switcher
  const allEvents: any[] = [];
  let mainEventName = event.name;
  let rootEventId = event.id;

  if (event.parentId) {
    // It's a sub-event, so include sibling sub-events
    mainEventName = event.parent!.name;
    rootEventId = event.parent!.id;
    event.parent!.subEvents.forEach(sub => {
      allEvents.push({ id: sub.id, name: sub.name });
    });
  } else {
    // It's a main event, so include all its sub-events
    event.subEvents.forEach(sub => {
      allEvents.push({ id: sub.id, name: sub.name });
    });
  }

  // Default to showing the active sub-event or the first sub-event
  const initialActiveId = event.parentId ? event.id : (allEvents[0]?.id || event.id);

  const settings = await getSettings(event.id);

  return (
    <div className="fest-page-wrapper">
      <VisitTracker eventId={event.id} />

      {/* Global Header matching dark navy gradient and gold accents */}
      <FestHeader 
        festName={mainEventName}
        festMoto={settings.festMoto || "Live Results Dashboard"}
        festLogo={settings.festLogo}
        searchUrl={`/search?eventId=${rootEventId}`}
        loginUrl="/login"
      />

      {/* Main Content Area */}
      <main className="fest-main-content">
        <div className="fest-container">
          <div className="fest-hero-title-area">
            <h2 className="fest-main-heading font-display">{mainEventName}</h2>
            <p className="fest-hero-sub font-body">Live Results Dashboard</p>
          </div>
          
          <PublicDashboard 
            initialEvents={allEvents.length > 0 ? allEvents : [{ id: event.id, name: event.name }]} 
            initialActiveId={initialActiveId} 
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="fest-footer">
        <div className="fest-container">
          <p className="fest-copy font-body">
            &copy; {new Date().getFullYear()} {mainEventName} • Live Leaderboard Standings
          </p>
          <div className="fest-power-chip">
            <p className="fest-power-text font-body">
              ⚡ Powered by <strong>Dpro Artsfest System</strong>
            </p>
            <a href="https://dpro-artsfest.vercel.app/" target="_blank" rel="noopener noreferrer" className="fest-power-link font-body">
              Host your arts fest on this platform ➔
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        .fest-page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .fest-main-content {
          flex: 1;
          padding: 2rem 0 3.5rem 0;
          container-type: inline-size;
          container-name: fest-shell;
        }

        .fest-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          box-sizing: border-box;
        }

        .fest-hero-title-area {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .fest-main-heading {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--ink);
          margin: 0 0 0.4rem 0;
          letter-spacing: -0.02em;
        }

        .fest-hero-sub {
          font-size: 1.05rem;
          color: var(--muted);
          margin: 0;
          font-weight: 500;
        }

        .fest-footer {
          padding: 2.5rem 0;
          border-top: 1px solid var(--border);
          background-color: var(--surface);
          text-align: center;
          color: var(--muted);
          margin-top: 3rem;
        }

        .fest-copy {
          margin: 0 0 1rem 0;
          font-size: 0.85rem;
        }

        .fest-power-chip {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 0.85rem 1.75rem;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          background: var(--bg);
          box-shadow: var(--shadow-sm);
        }

        .fest-power-text {
          font-size: 0.82rem;
          color: var(--text);
          margin: 0;
        }

        .fest-power-link {
          font-size: 0.78rem;
          color: var(--indigo);
          font-weight: 700;
          text-decoration: none;
        }

        .fest-power-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .fest-container {
            padding: 0 0.75rem;
          }
          .fest-main-heading {
            font-size: 1.75rem;
          }
          .fest-hero-sub {
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
}
