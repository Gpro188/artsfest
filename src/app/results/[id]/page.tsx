import { getProgramResults } from "@/app/actions/public";
import ProgramResultsView from "@/app/components/ProgramResultsView";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import FestHeader from "@/app/components/FestHeader";

export const dynamic = "force-dynamic";

export default async function ProgramResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getProgramResults(id);
  const session = await getServerSession(authOptions);

  if (!res.success || !res.data) {
    notFound();
  }

  const { program, settings: rawSettings } = res.data;

  if (!program) {
    notFound();
  }
  const userRole = session?.user?.role;

  const settings = rawSettings || {
    festName: "Arts Fest",
    festMoto: "Celebrating Creativity",
    festLogo: null
  };

  const festName = program.event?.name || settings.festName;
  const dashboardUrl = program.event?.parentId
    ? `/fest/${program.event.parentId}/results`
    : `/fest/${program.eventId}/results`;

  return (
    <div className="program-result-page-root">
      {/* Global Fest Header */}
      <FestHeader 
        festName={festName}
        festMoto={settings.festMoto || "Official Results Feed"}
        festLogo={settings.festLogo}
        searchUrl={`/search?eventId=${program.eventId}`}
        loginUrl="/login"
        backUrl={dashboardUrl}
        backLabel="Dashboard"
      />

      <main className="program-result-main">
        <div className="program-result-container">
          <ProgramResultsView program={program} settings={settings} userRole={userRole} />
        </div>
      </main>

      <footer className="program-result-footer no-print">
        <div className="program-result-container">
          <p className="font-body">&copy; {new Date().getFullYear()} {festName} • Official Results Feed</p>
        </div>
      </footer>

      <style>{`
        .program-result-page-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .program-result-main {
          flex: 1;
          padding: 2rem 0 3.5rem 0;
          container-type: inline-size;
          container-name: fest-shell;
        }

        .program-result-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        .program-result-footer {
          padding: 2rem 0;
          border-top: 1px solid var(--border);
          text-align: center;
          color: var(--muted);
          background-color: var(--surface);
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
