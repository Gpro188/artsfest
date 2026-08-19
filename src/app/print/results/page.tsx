import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PrintCategoryResultsPage(props: {
  searchParams: Promise<{
    eventId?: string;
    categoryId?: string;
    type?: string;
    status?: string; // 'published' | 'all'
  }>;
}) {
  const searchParams = await props.searchParams;
  const eventId = searchParams.eventId;
  const categoryId = searchParams.categoryId;
  const programType = searchParams.type;
  const status = searchParams.status || "published";

  if (!eventId) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Event ID is required to print results</h2>
        <Link href="/dashboard/scoring" style={{ color: "#10b981", fontWeight: "bold" }}>
          &larr; Back to Results & Scoring
        </Link>
      </div>
    );
  }

  const [event, settings, categories] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      include: { parent: true }
    }),
    getSettings(eventId),
    prisma.category.findMany({
      where: { eventId },
      orderBy: { name: "asc" }
    })
  ]);

  if (!event) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Event not found</h2>
      </div>
    );
  }

  // Build program filter
  const programWhere: any = { eventId };
  if (categoryId && categoryId !== "ALL") {
    if (categoryId === "GENERAL") {
      programWhere.type = "GENERAL";
    } else {
      programWhere.categoryId = categoryId;
    }
  }
  if (programType && programType !== "ALL") {
    programWhere.type = programType;
  }

  // Result publication filter
  const resultWhere: any = {};
  if (status === "published") {
    resultWhere.isPublished = true;
  }

  const programs = await prisma.program.findMany({
    where: programWhere,
    include: {
      category: true,
      results: {
        where: resultWhere,
        include: {
          candidate: {
            include: { team: true, category: true }
          },
          team: true
        },
        orderBy: [
          { rank: "asc" },
          { marks: "desc" }
        ]
      }
    },
    orderBy: [
      { category: { name: "asc" } },
      { type: "asc" },
      { name: "asc" }
    ]
  });

  // Filter only programs that have results
  const programsWithResults = programs.filter(p => p.results.length > 0);

  const festName = event.parent?.name || event.name || settings.festName;
  const subFestName = event.parent ? event.name : null;

  const selectedCategoryName = categoryId === "ALL" || !categoryId
    ? "All Categories"
    : categoryId === "GENERAL"
    ? "General Programs"
    : categories.find(c => c.id === categoryId)?.name || "Selected Category";

  const selectedTypeName = programType === "ALL" || !programType
    ? "All Types (Ind / Group / Gen)"
    : programType;

  return (
    <div style={{ padding: "30px 40px", backgroundColor: "#ffffff", color: "#111827", minHeight: "100vh", fontFamily: "var(--font-poster), 'Segoe UI', Arial, sans-serif" }}>
      
      {/* Non-Print Filter Bar & Action Header */}
      <div className="no-print" style={{ 
        marginBottom: "24px", 
        padding: "16px 20px", 
        backgroundColor: "#f8fafc", 
        border: "1px solid #e2e8f0", 
        borderRadius: "12px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href={`/dashboard/scoring?eventId=${eventId}`} style={{ color: "#475569", textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
            &larr; Back to Scoring
          </Link>
          <span style={{ color: "#cbd5e1" }}>|</span>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>
            Showing: <span style={{ color: "#10b981" }}>{selectedCategoryName}</span> • <span style={{ color: "#3b82f6" }}>{selectedTypeName}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <PrintButton label="🖨️ Print Official Result Sheet" color="#10b981" />
        </div>
      </div>

      {/* Official Fest Header for Printing */}
      <div style={{ textAlign: "center", marginBottom: "25px", borderBottom: "3px double #000000", paddingBottom: "16px" }}>
        {settings.festLogo && (
          <img 
            src={settings.festLogo} 
            alt="Logo" 
            style={{ maxHeight: "65px", margin: "0 auto 8px auto", objectFit: "contain", display: "block" }} 
          />
        )}
        <h1 style={{ margin: "0 0 4px 0", fontSize: "1.8rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px", color: "#000000" }}>
          {festName}
        </h1>
        {subFestName && (
          <h2 style={{ margin: "0 0 4px 0", fontSize: "1.2rem", fontWeight: 800, color: "#334155", textTransform: "uppercase" }}>
            {subFestName}
          </h2>
        )}
        <div style={{ fontSize: "1rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "2px", color: "#000000", margin: "6px 0 2px 0" }}>
          Official Festival Results Sheet
        </div>
        <p style={{ margin: 0, fontSize: "0.85rem", fontStyle: "italic", color: "#475569" }}>
          {settings.festMoto || "Celebrating Creativity & Talent"}
        </p>
      </div>

      {/* Meta Filter Strip */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        marginBottom: "20px", 
        backgroundColor: "#f1f5f9", 
        padding: "10px 16px", 
        border: "1px solid #000000",
        fontSize: "0.85rem",
        fontWeight: 700
      }}>
        <div>
          <div>CATEGORY: <span style={{ textTransform: "uppercase" }}>{selectedCategoryName}</span></div>
          <div>PROGRAM TYPE: <span style={{ textTransform: "uppercase" }}>{selectedTypeName}</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>TOTAL PUBLISHED PROGRAMS: {programsWithResults.length}</div>
          <div>DATE: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
        </div>
      </div>

      {/* Results Content */}
      {programsWithResults.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", border: "1px solid #cbd5e1", borderRadius: "8px", color: "#64748b" }}>
          <h3>No published results found for the selected category/type filters.</h3>
          <p>Please record and publish program results in <strong>Results & Scoring</strong> first.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {programsWithResults.map((prog, pIdx) => (
            <div key={prog.id} style={{ pageBreakInside: "avoid", border: "1px solid #000000", borderRadius: "4px", overflow: "hidden" }}>
              {/* Program Header */}
              <div style={{ 
                backgroundColor: "#e2e8f0", 
                padding: "8px 14px", 
                borderBottom: "1px solid #000000",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <strong style={{ fontSize: "1.05rem", color: "#000000" }}>
                    {pIdx + 1}. {prog.name}
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#475569", marginLeft: "10px" }}>
                    ({prog.category?.name || "General"} • {prog.type})
                  </span>
                </div>
                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#0f172a" }}>
                  Code: {prog.programCode ? String(prog.programCode).padStart(2, "0") : `${pIdx + 1}`}
                </div>
              </div>

              {/* Program Winners Table */}
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#000000", color: "#ffffff", textAlign: "left" }}>
                    <th style={{ padding: "6px 10px", width: "70px", borderRight: "1px solid #334155" }}>Rank</th>
                    <th style={{ padding: "6px 10px", width: "70px", borderRight: "1px solid #334155" }}>Grade</th>
                    <th style={{ padding: "6px 10px", width: "80px", borderRight: "1px solid #334155", textAlign: "center" }}>Chest #</th>
                    <th style={{ padding: "6px 10px", borderRight: "1px solid #334155" }}>Candidate / Participant Name</th>
                    <th style={{ padding: "6px 10px", borderRight: "1px solid #334155" }}>Team</th>
                    <th style={{ padding: "6px 10px", width: "70px", textAlign: "center" }}>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {prog.results.map((res, rIdx) => {
                    const participantName = res.candidate?.name || res.team?.name || "-";
                    const chestNo = res.candidate?.chestNumber || "-";
                    const teamName = res.candidate?.team?.name || res.team?.name || "-";

                    return (
                      <tr key={res.id || rIdx} style={{ 
                        borderBottom: "1px solid #cbd5e1",
                        backgroundColor: rIdx % 2 === 0 ? "#ffffff" : "#f8fafc"
                      }}>
                        <td style={{ padding: "6px 10px", borderRight: "1px solid #cbd5e1", fontWeight: 900, color: res.rank === 1 ? "#047857" : res.rank === 2 ? "#c2410c" : res.rank === 3 ? "#b91c1c" : "#000000" }}>
                          {res.rank ? (res.rank === 1 ? "1st" : res.rank === 2 ? "2nd" : res.rank === 3 ? "3rd" : `${res.rank}th`) : "-"}
                        </td>
                        <td style={{ padding: "6px 10px", borderRight: "1px solid #cbd5e1", fontWeight: 800 }}>
                          {res.grade || "-"}
                        </td>
                        <td style={{ padding: "6px 10px", borderRight: "1px solid #cbd5e1", textAlign: "center", fontWeight: 800, color: "#1e293b" }}>
                          {chestNo}
                        </td>
                        <td style={{ padding: "6px 10px", borderRight: "1px solid #cbd5e1", fontWeight: 800, textTransform: "uppercase" }}>
                          {participantName}
                        </td>
                        <td style={{ padding: "6px 10px", borderRight: "1px solid #cbd5e1", fontWeight: 700, color: "#334155" }}>
                          {teamName}
                        </td>
                        <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 900 }}>
                          {res.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Official Signatures Section */}
      <div style={{ 
        marginTop: "60px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-end",
        pageBreakInside: "avoid"
      }}>
        <div style={{ borderTop: "1.5px solid #000000", width: "180px", textAlign: "center", paddingTop: "6px", fontSize: "0.85rem", fontWeight: 700 }}>
          Result Controller
        </div>
        <div style={{ borderTop: "1.5px solid #000000", width: "180px", textAlign: "center", paddingTop: "6px", fontSize: "0.85rem", fontWeight: 700 }}>
          General Convener
        </div>
        <div style={{ borderTop: "1.5px solid #000000", width: "180px", textAlign: "center", paddingTop: "6px", fontSize: "0.85rem", fontWeight: 700 }}>
          Office Seal
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; }
          @page {
            margin: 1.5cm;
            size: A4 portrait;
          }
        }
      `}} />
    </div>
  );
}
