import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import PosterSettingsForm from "./PosterSettingsForm";
import CategoryBrandingForm from "./CategoryBrandingForm";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import Link from "next/link";

export default async function MediaPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MEDIA")) {
    redirect("/dashboard");
  }

  const { eventId } = session.user;
  const initialSettings = await getSettings(eventId);
  
  const eventFilter = eventId ? { eventId } : undefined;

  const categories = await prisma.category.findMany({
    where: eventFilter,
    orderBy: { name: 'asc' }
  });
  
  let publishedWhere: any = {
    results: {
      some: { isPublished: true }
    }
  };

  if (eventId) {
    const targetEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: { subEvents: true }
    });
    if (targetEvent) {
      const allRelatedEventIds = [targetEvent.id, ...(targetEvent.subEvents?.map(s => s.id) || [])];
      publishedWhere.eventId = { in: allRelatedEventIds };
    } else {
      publishedWhere.eventId = eventId;
    }
  }

  // Fetch a sample real published program with results to test live in the Media Center
  const sampleProgram = await prisma.program.findFirst({
    where: publishedWhere,
    include: {
      category: true,
      event: true,
      results: {
        where: { isPublished: true },
        include: {
          candidate: { include: { team: true } },
          team: true
        },
        orderBy: { rank: 'asc' },
        take: 3
      }
    }
  });

  // Programs that have results and are published - for the download center
  const publishedPrograms = await prisma.program.findMany({
    where: publishedWhere,
    include: {
      category: true,
      event: true
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-lg)' }}>
        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>Media Center</h1>
        <p className="page-description">Design result posters, position text over your background, and manage category styles.</p>
      </div>

      {/* Main Studio Section: Poster Preview on Left & Adjustment Sliders on Right */}
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <PosterSettingsForm initialSettings={initialSettings} sampleProgram={sampleProgram} />
      </div>

      {/* Lower Section: Category Branding & Template Download Center */}
      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'start' }}>
        <div data-tour="media-category">
          <CategoryBrandingForm categories={categories} />
        </div>

        <div data-tour="media-downloads" className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>🖼️ Template Download Center</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--spacing-lg)' }}>
                Quickly access published program result boards to view or download finalized posters.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto', paddingRight: '6px' }}>
                {publishedPrograms.length > 0 ? publishedPrograms.map(program => (
                    <div key={program.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px 14px', 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{program.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{program.category?.name}</div>
                        </div>
                        <Link href={`/results/${program.id}`} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                            Open Poster
                        </Link>
                    </div>
                )) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No published program results found.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
