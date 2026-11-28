import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import { getReportsData } from "@/app/actions/reports";

export const dynamic = "force-dynamic";

export default async function PrintHallOfFamePage(props: {
  searchParams: Promise<{
    eventId?: string;
    categoryId?: string;
    teamId?: string;
    minPoints?: string;
    status?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const eventId = searchParams.eventId;
  const categoryId = searchParams.categoryId;
  const teamId = searchParams.teamId;
  const minPointsFilter = searchParams.minPoints === "all" ? 0 : 1; // default to scorers (>0) or all
  const statusFilter = searchParams.status || "published";

  if (!eventId) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Event ID is required to print Hall of Fame report</h2>
        <Link href="/dashboard/reports" style={{ color: "#10b981", fontWeight: "bold" }}>
          &larr; Back to Reports Hub
        </Link>
      </div>
    );
  }

  const res = await getReportsData(eventId);
  if (!res.success || !res.data) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Failed to load Hall of Fame data: {res.error}</h2>
        <Link href="/dashboard/reports" style={{ color: "#10b981", fontWeight: "bold" }}>
          &larr; Back to Reports Hub
        </Link>
      </div>
    );
  }

  const { festName, festMoto, festLogo, categories, teams, candidates, stats } = res.data;

  // Apply filters
  let filteredCandidates = candidates.filter(c => {
    // Category filter
    if (categoryId && categoryId !== "ALL") {
      if (c.categoryId !== categoryId && c.categoryName.toUpperCase() !== categoryId.toUpperCase()) {
        return false;
      }
    }
    // Team filter
    if (teamId && teamId !== "ALL") {
      if (c.teamId !== teamId) return false;
    }
    // Min points filter
    const pts = statusFilter === "published" ? c.netPointsPublished : c.netPointsTotal;
    if (minPointsFilter > 0 && pts <= 0) {
      return false;
    }
    return true;
  });

  const selectedCategoryName = categoryId && categoryId !== "ALL"
    ? categories.find(c => c.id === categoryId)?.name || categoryId
    : "All Categories (Overall)";

  const selectedTeamName = teamId && teamId !== "ALL"
    ? teams.find(t => t.id === teamId)?.name || teamId
    : "All Teams";

  return (
    <div style={{ padding: "30px", backgroundColor: "white", color: "#000", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; color: black !important; padding: 0 !important; }
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          tr { page-break-inside: avoid; }
          .page-break { page-break-after: always; }
        }
      `}} />

      {/* Official Header */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #111827", paddingBottom: "14px", marginBottom: "20px" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginBottom: "6px" }}>
          {festLogo && (
            <img src={festLogo} alt="Fest Logo" style={{ height: "48px", width: "auto", objectFit: "contain" }} />
          )}
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "800", letterSpacing: "-0.5px", textTransform: "uppercase" }}>
            {festName}
          </h1>
        </div>
        <p style={{ margin: "2px 0 6px 0", fontSize: "0.875rem", fontStyle: "italic", color: "#4b5563" }}>
          {festMoto}
        </p>
        <div style={{ display: "inline-block", backgroundColor: "#111827", color: "#fff", padding: "4px 14px", borderRadius: "4px", fontSize: "0.85rem", fontWeight: "700", letterSpacing: "1px", textTransform: "uppercase" }}>
          Official Hall of Fame & Student Standings
        </div>
      </div>

      {/* Scope Subheader */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem", backgroundColor: "#f3f4f6", padding: "8px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", marginBottom: "16px" }}>
        <div>
          <span><strong>Category:</strong> {selectedCategoryName}</span>
          <span style={{ margin: "0 10px", color: "#9ca3af" }}>|</span>
          <span><strong>Team:</strong> {selectedTeamName}</span>
          <span style={{ margin: "0 10px", color: "#9ca3af" }}>|</span>
          <span><strong>Scoring Mode:</strong> {statusFilter === "published" ? "Published Results Only" : "All Results (Inc. Draft)"}</span>
        </div>
        <div>
          <span><strong>Total Students Listed:</strong> {filteredCandidates.length}</span>
        </div>
      </div>

      {/* Candidate Standings Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", marginBottom: "24px" }}>
        <thead>
          <tr style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
            <th style={{ border: "1px solid #1f2937", padding: "8px 6px", width: "45px", textAlign: "center" }}>Rank</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 6px", width: "65px", textAlign: "center" }}>Chest #</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 10px", textAlign: "left" }}>Student Name</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 10px", textAlign: "left" }}>Team / House</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 10px", textAlign: "left", width: "110px" }}>Category</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 6px", width: "70px", textAlign: "center" }}>1st / 2nd / 3rd</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 6px", width: "65px", textAlign: "center" }}>A / B Grade</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 6px", width: "60px", textAlign: "center" }}>Programs</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 6px", width: "55px", textAlign: "center" }}>Penalty</th>
            <th style={{ border: "1px solid #1f2937", padding: "8px 8px", width: "75px", textAlign: "right" }}>Total Points</th>
          </tr>
        </thead>
        <tbody>
          {filteredCandidates.map((cand, idx) => {
            const displayRank = categoryId && categoryId !== "ALL" ? cand.categoryRank : cand.overallRank;
            const pts = statusFilter === "published" ? cand.netPointsPublished : cand.netPointsTotal;
            const isTop3 = displayRank <= 3 && pts > 0;

            return (
              <tr 
                key={cand.id} 
                style={{ 
                  backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  fontWeight: isTop3 ? "600" : "normal"
                }}
              >
                <td style={{ border: "1px solid #d1d5db", padding: "7px 6px", textAlign: "center" }}>
                  {isTop3 ? (
                    <span style={{ 
                      display: "inline-block", 
                      width: "22px", 
                      height: "22px", 
                      lineHeight: "22px", 
                      borderRadius: "50%", 
                      backgroundColor: displayRank === 1 ? "#fbbf24" : displayRank === 2 ? "#9ca3af" : "#d97706",
                      color: "#000",
                      fontWeight: "bold",
                      fontSize: "0.75rem"
                    }}>
                      {displayRank}
                    </span>
                  ) : (
                    <span>{displayRank || idx + 1}</span>
                  )}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 6px", textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>
                  {cand.chestNumber ? `#${cand.chestNumber}` : "-"}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 10px" }}>
                  <strong>{cand.name}</strong>
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 10px" }}>
                  {cand.teamName}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 10px" }}>
                  {cand.categoryName}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 6px", textAlign: "center" }}>
                  {cand.rank1Count}/{cand.rank2Count}/{cand.rank3Count}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 6px", textAlign: "center" }}>
                  {cand.gradeACount}/{cand.gradeBCount}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 6px", textAlign: "center" }}>
                  {cand.programs.length}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 6px", textAlign: "center", color: cand.individualPenalties > 0 ? "#dc2626" : "#6b7280" }}>
                  {cand.individualPenalties > 0 ? `-${cand.individualPenalties}` : "0"}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "7px 8px", textAlign: "right", fontWeight: "bold", fontSize: "0.9rem", color: pts > 0 ? "#047857" : "#6b7280" }}>
                  {pts} pts
                </td>
              </tr>
            );
          })}

          {filteredCandidates.length === 0 && (
            <tr>
              <td colSpan={10} style={{ border: "1px solid #d1d5db", padding: "24px", textAlign: "center", color: "#6b7280" }}>
                No students match the selected filter criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Official Verification Signatures */}
      <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          <div>Generated on: {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
          <div>Dpro Artsfest Management System · Verified Official Record</div>
        </div>

        <div style={{ display: "flex", gap: "50px", textAlign: "center" }}>
          <div>
            <div style={{ borderTop: "1px solid #111827", width: "140px", paddingTop: "5px", fontSize: "0.8rem", fontWeight: "600" }}>
              Chief Tabulator
            </div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #111827", width: "140px", paddingTop: "5px", fontSize: "0.8rem", fontWeight: "600" }}>
              General Convener
            </div>
          </div>
          <div>
            <div style={{ borderTop: "1px solid #111827", width: "140px", paddingTop: "5px", fontSize: "0.8rem", fontWeight: "600" }}>
              Office Seal
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Controls */}
      <div className="no-print" style={{ position: "fixed", bottom: "24px", right: "24px", display: "flex", gap: "10px", zIndex: 50 }}>
        <Link
          href={`/dashboard/reports?eventId=${eventId}`}
          style={{
            padding: "10px 18px",
            backgroundColor: "#f3f4f6",
            color: "#1f2937",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            fontWeight: "bold",
            textDecoration: "none",
            fontSize: "0.85rem",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          &larr; Back to Reports
        </Link>
        <PrintButton label="Print / Save PDF" color="#10B981" />
      </div>
    </div>
  );
}
