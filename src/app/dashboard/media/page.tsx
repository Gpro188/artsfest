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

  const initialSettings = await getSettings();
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });
  
  // Programs that have results and are published - for the download center
  const publishedPrograms = await prisma.program.findMany({
    where: {
        results: {
            some: { isPublished: true }
        }
    },
    include: {
        category: true
    },
    orderBy: { name: 'asc' }
  });

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1>Media Center</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage event branding, category styles, and official result media.</p>
      </div>

      <div className="mobile-grid-1" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--spacing-xl)', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
            <PosterSettingsForm initialSettings={initialSettings} />
            <CategoryBrandingForm categories={categories} />
        </div>

        <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', position: 'sticky', top: '20px' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>🖼️ Template Download Center</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--spacing-lg)' }}>
                Quickly access program result boards to download "Clean Body" templates for your manual designs.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '700px', overflowY: 'auto', paddingRight: '10px' }}>
                {publishedPrograms.length > 0 ? publishedPrograms.map(program => (
                    <div key={program.id} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px', 
                        backgroundColor: 'rgba(255,255,255,0.05)', 
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div>
                            <div style={{ fontWeight: 600 }}>{program.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{program.category?.name}</div>
                        </div>
                        <Link href={`/results/${program.id}`} className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                            Open Generator
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
