import { prisma } from "@/lib/prisma";
import PrintButton from "@/components/PrintButton";
import Link from "next/link";
import { getReportsData } from "@/app/actions/reports";

export const dynamic = "force-dynamic";

export default async function PrintTeamStandingsPage(props: {
  searchParams: Promise<{
    eventId?: string;
  }>;
}) {
  const searchParams = await props.searchParams;
  const eventId = searchParams.eventId;

  if (!eventId) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Event ID is required to print team championship report</h2>
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
        <h2>Failed to load team standings data: {res.error}</h2>
        <Link href="/dashboard/reports" style={{ color: "#10b981", fontWeight: "bold" }}>
          &larr; Back to Reports Hub
        </Link>
      </div>
    );
  }

  const { festName, festMoto, festLogo, categories, teamsStandings } = res.data;

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
          Official Team Championship Standings
        </div>
      </div>

      {/* Standings Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "24px" }}>
        <thead>
          <tr style={{ backgroundColor: "#1f2937", color: "#ffffff" }}>
            <th style={{ border: "1px solid #1f2937", padding: "10px 8px", width: "55px", textAlign: "center" }}>Rank</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 12px", textAlign: "left" }}>Team / House</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 10px", textAlign: "center", width: "80px" }}>Students</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 10px", textAlign: "right", width: "85px" }}>Individual</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 10px", textAlign: "right", width: "80px" }}>Group</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 10px", textAlign: "right", width: "80px" }}>General</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 10px", textAlign: "right", width: "80px" }}>Gross</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 10px", textAlign: "right", width: "80px" }}>Penalty</th>
            <th style={{ border: "1px solid #1f2937", padding: "10px 12px", textAlign: "right", width: "100px" }}>Net Score</th>
          </tr>
        </thead>
        <tbody>
          {teamsStandings.map((team, idx) => {
            const isTop3 = team.rank <= 3 && team.netPoints > 0;
            return (
              <tr 
                key={team.id}
                style={{ 
                  backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f9fafb",
                  fontWeight: isTop3 ? "600" : "normal"
                }}
              >
                <td style={{ border: "1px solid #d1d5db", padding: "10px 8px", textAlign: "center" }}>
                  {isTop3 ? (
                    <span style={{ 
                      display: "inline-block", 
                      width: "24px", 
                      height: "24px", 
                      lineHeight: "24px", 
                      borderRadius: "50%", 
                      backgroundColor: team.rank === 1 ? "#fbbf24" : team.rank === 2 ? "#9ca3af" : "#d97706",
                      color: "#000",
                      fontWeight: "bold",
                      fontSize: "0.8rem"
                    }}>
                      {team.rank}
                    </span>
                  ) : (
                    <span>{team.rank || idx + 1}</span>
                  )}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: team.flagColor || "#6366f1", display: "inline-block" }}></span>
                    <strong style={{ fontSize: "0.95rem" }}>{team.name}</strong>
                    {team.prefixCode && <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>({team.prefixCode})</span>}
                  </div>
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 10px", textAlign: "center" }}>
                  {team.candidatesCount}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 10px", textAlign: "right" }}>
                  {team.individualPoints}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 10px", textAlign: "right" }}>
                  {team.groupPoints}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 10px", textAlign: "right" }}>
                  {team.generalPoints}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 10px", textAlign: "right", color: "#4b5563" }}>
                  {team.grossPoints}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 10px", textAlign: "right", color: team.penaltyPoints > 0 ? "#dc2626" : "#6b7280" }}>
                  {team.penaltyPoints > 0 ? `-${team.penaltyPoints}` : "0"}
                </td>
                <td style={{ border: "1px solid #d1d5db", padding: "10px 12px", textAlign: "right", fontWeight: "bold", fontSize: "1.05rem", color: team.netPoints > 0 ? "#047857" : "#111827" }}>
                  {team.netPoints} pts
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Category breakdown sub-table if categories exist */}
      {categories.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "8px", textTransform: "uppercase", color: "#374151" }}>
            Category-wise Team Score Distribution
          </h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={{ border: "1px solid #d1d5db", padding: "8px 10px", textAlign: "left" }}>Team</th>
                {categories.map(cat => (
                  <th key={cat.id} style={{ border: "1px solid #d1d5db", padding: "8px 8px", textAlign: "right" }}>{cat.name}</th>
                ))}
                <th style={{ border: "1px solid #d1d5db", padding: "8px 8px", textAlign: "right" }}>Total Points</th>
              </tr>
            </thead>
            <tbody>
              {teamsStandings.map(t => (
                <tr key={t.id}>
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 10px", fontWeight: "600" }}>{t.name}</td>
                  {categories.map(cat => (
                    <td key={cat.id} style={{ border: "1px solid #d1d5db", padding: "6px 8px", textAlign: "right" }}>
                      {t.categoryBreakdown[cat.name] || 0}
                    </td>
                  ))}
                  <td style={{ border: "1px solid #d1d5db", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                    {t.netPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Official Verification Signatures */}
      <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
          <div>Generated on: {new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</div>
          <div>Dpro Artsfest Management System · Official Championship Declaration</div>
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
        <PrintButton label="Print Team Standings / Save PDF" color="#4F46E5" />
      </div>
    </div>
  );
}
