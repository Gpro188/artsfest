"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import Link from "next/link";
import {
  Trophy,
  Star,
  Printer,
  Download,
  Search,
  Filter,
  Sparkles,
  Users,
  Calendar,
  FileText,
  Shield,
  Eye,
  X,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Award
} from "lucide-react";
import type {
  ReportsDataResponse,
  CandidateStarReport,
  TeamStandingReport,
  ProgramResultReport,
  CandidateDirectoryItem,
  ScheduleReportItem
} from "@/app/actions/reports";

interface ReportsHubClientProps {
  initialData: ReportsDataResponse;
  events: Array<{ id: string; name: string }>;
  activeEventId: string;
}

export default function ReportsHubClient({
  initialData,
  events,
  activeEventId
}: ReportsHubClientProps) {
  const [activeTab, setActiveTab] = useState<
    "hall" | "teams" | "results" | "candidates" | "schedule" | "printCenter"
  >("hall");

  // Filters for Hall of Fame
  const [candidateCategoryFilter, setCandidateCategoryFilter] = useState<string>("ALL");
  const [candidateTeamFilter, setCandidateTeamFilter] = useState<string>("ALL");
  const [candidateMinPointsFilter, setCandidateMinPointsFilter] = useState<"scorers" | "all">("scorers");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState<"published" | "all">("published");
  const [candidateSearchQuery, setCandidateSearchQuery] = useState<string>("");

  // Modal for individual student breakdown
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateStarReport | null>(null);

  // Filters for Program Results
  const [resultsCategoryFilter, setResultsCategoryFilter] = useState<string>("ALL");
  const [resultsTypeFilter, setResultsTypeFilter] = useState<string>("ALL");

  // Filters for Candidates Directory
  const [directoryTeamFilter, setDirectoryTeamFilter] = useState<string>("ALL");
  const [directoryCategoryFilter, setDirectoryCategoryFilter] = useState<string>("ALL");

  const {
    event,
    festName,
    festMoto,
    festLogo,
    categories,
    teams,
    candidates,
    teamsStandings,
    programResults,
    candidateDirectory,
    schedule,
    stats
  } = initialData;

  // ─────────────────────────────────────────────────────────────
  // FILTERED CANDIDATES (HALL OF FAME)
  // ─────────────────────────────────────────────────────────────
  const filteredCandidates = useMemo(() => {
    return candidates.filter((cand) => {
      // Category filter
      if (candidateCategoryFilter !== "ALL") {
        if (
          cand.categoryId !== candidateCategoryFilter &&
          cand.categoryName.toUpperCase() !== candidateCategoryFilter.toUpperCase()
        ) {
          return false;
        }
      }

      // Team filter
      if (candidateTeamFilter !== "ALL" && cand.teamId !== candidateTeamFilter) {
        return false;
      }

      // Min points filter
      const pts =
        candidateStatusFilter === "published"
          ? cand.netPointsPublished
          : cand.netPointsTotal;
      if (candidateMinPointsFilter === "scorers" && pts <= 0) {
        return false;
      }

      // Search query filter (name or chest number)
      if (candidateSearchQuery.trim()) {
        const query = candidateSearchQuery.trim().toLowerCase();
        const matchesName = cand.name.toLowerCase().includes(query);
        const matchesChest = cand.chestNumber
          ? cand.chestNumber.toLowerCase().includes(query)
          : false;
        const matchesTeam = cand.teamName.toLowerCase().includes(query);
        if (!matchesName && !matchesChest && !matchesTeam) {
          return false;
        }
      }

      return true;
    });
  }, [
    candidates,
    candidateCategoryFilter,
    candidateTeamFilter,
    candidateMinPointsFilter,
    candidateStatusFilter,
    candidateSearchQuery
  ]);

  // ─────────────────────────────────────────────────────────────
  // EXCEL EXPORTS
  // ─────────────────────────────────────────────────────────────

  // 1. Hall of Fame Excel Export
  const exportHallOfFameExcel = () => {
    if (filteredCandidates.length === 0) {
      alert("No students match your selected filters to export.");
      return;
    }

    const data = filteredCandidates.map((c, idx) => {
      const displayRank =
        candidateCategoryFilter !== "ALL" ? c.categoryRank : c.overallRank;
      const pts =
        candidateStatusFilter === "published"
          ? c.netPointsPublished
          : c.netPointsTotal;
      const gross =
        candidateStatusFilter === "published"
          ? c.grossPointsPublished
          : c.grossPointsTotal;

      return {
        "SL No": idx + 1,
        "Overall Rank": c.overallRank || idx + 1,
        "Category Rank": c.categoryRank || "-",
        "Chest Number": c.chestNumber || "-",
        "Student Name": c.name,
        "Team / House": c.teamName,
        "Category": c.categoryName,
        "1st Places": c.rank1Count,
        "2nd Places": c.rank2Count,
        "3rd Places": c.rank3Count,
        "Grade A": c.gradeACount,
        "Grade B": c.gradeBCount,
        "Grade C": c.gradeCCount,
        "Programs Participated": c.programs.length,
        "Gross Points": gross,
        "Penalties Deducted": c.individualPenalties > 0 ? -c.individualPenalties : 0,
        "Total Achieved Points": pts,
        "Approval Status": c.isApproved ? "Approved" : "Pending"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-fit column widths
    const colWidths = [
      { wch: 8 },  // SL No
      { wch: 12 }, // Overall Rank
      { wch: 14 }, // Category Rank
      { wch: 14 }, // Chest Number
      { wch: 25 }, // Student Name
      { wch: 20 }, // Team
      { wch: 18 }, // Category
      { wch: 12 }, // 1st
      { wch: 12 }, // 2nd
      { wch: 12 }, // 3rd
      { wch: 10 }, // Grade A
      { wch: 10 }, // Grade B
      { wch: 10 }, // Grade C
      { wch: 20 }, // Programs
      { wch: 14 }, // Gross
      { wch: 18 }, // Penalties
      { wch: 20 }, // Total Points
      { wch: 16 }  // Status
    ];
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Hall of Fame");

    const catLabel =
      candidateCategoryFilter === "ALL"
        ? "All_Categories"
        : candidateCategoryFilter.replace(/\s+/g, "_");
    const filename = `${festName.replace(/\s+/g, "_")}_Hall_Of_Fame_Students_${catLabel}_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  // 2. Team Standings Excel Export
  const exportTeamStandingsExcel = () => {
    const data = teamsStandings.map((t, idx) => {
      const row: any = {
        "Rank": t.rank || idx + 1,
        "Team Name": t.name,
        "Team Code": t.prefixCode || "-",
        "Leader Name": t.leaderName || "-",
        "Total Students": t.candidatesCount,
        "Individual Points": t.individualPoints,
        "Group Points": t.groupPoints,
        "General Points": t.generalPoints,
        "Gross Points": t.grossPoints,
        "Penalties Deducted": t.penaltyPoints > 0 ? -t.penaltyPoints : 0,
        "Total Net Score": t.netPoints
      };

      // Add category breakdown
      categories.forEach((cat) => {
        row[`Category: ${cat.name}`] = t.categoryBreakdown[cat.name] || 0;
      });

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Team Standings");

    const filename = `${festName.replace(/\s+/g, "_")}_Team_Standings_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // 3. Program Results Master Excel Export
  const exportProgramResultsExcel = () => {
    const rows: any[] = [];
    programResults.forEach((p) => {
      if (resultsCategoryFilter !== "ALL" && p.categoryId !== resultsCategoryFilter) {
        return;
      }
      if (resultsTypeFilter !== "ALL" && p.type !== resultsTypeFilter) {
        return;
      }

      if (p.winners.length === 0) {
        rows.push({
          "Program Code": p.programCode || "-",
          "Program Name": p.name,
          "Category": p.categoryName,
          "Type": p.type,
          "Venue": p.venue || "-",
          "Status": p.isEvaluated ? "Evaluated (No Winners)" : "Pending",
          "Rank": "-",
          "Grade": "-",
          "Marks": "-",
          "Points": 0,
          "Winner / Participant": "-",
          "Chest Number": "-",
          "Team": "-"
        });
      } else {
        p.winners.forEach((w) => {
          rows.push({
            "Program Code": p.programCode || "-",
            "Program Name": p.name,
            "Category": p.categoryName,
            "Type": p.type,
            "Venue": p.venue || "-",
            "Status": p.isPublished ? "Published" : "Draft",
            "Rank": w.rank ? `${w.rank}` : "-",
            "Grade": w.grade || "-",
            "Marks": w.marks || "-",
            "Points": w.points,
            "Winner / Participant": w.candidateName || "-",
            "Chest Number": w.chestNumber ? `#${w.chestNumber}` : "-",
            "Team": w.teamName
          });
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Program Results");

    const filename = `${festName.replace(/\s+/g, "_")}_Program_Results_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // 4. Candidate Directory Excel Export
  const exportCandidateDirectoryExcel = () => {
    const rows = candidateDirectory
      .filter((c) => {
        if (directoryTeamFilter !== "ALL" && c.teamId !== directoryTeamFilter) return false;
        if (directoryCategoryFilter !== "ALL" && c.categoryId !== directoryCategoryFilter) return false;
        return true;
      })
      .map((c, idx) => ({
        "SL No": idx + 1,
        "Chest Number": c.chestNumber || "-",
        "Student Name": c.name,
        "Team": c.teamName,
        "Category": c.categoryName,
        "Approved Status": c.isApproved ? "Approved" : "Pending Approval",
        "Enrolled Programs": c.programsCount
      }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Candidate Directory");

    const filename = `${festName.replace(/\s+/g, "_")}_Candidate_Directory_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // 5. Schedule Excel Export
  const exportScheduleExcel = () => {
    const rows = schedule.map((s, idx) => ({
      "SL No": idx + 1,
      "Program Code": s.programCode || "-",
      "Program Name": s.name,
      "Category": s.categoryName,
      "Type": s.type,
      "Venue / Stage": s.venue || "TBA",
      "Start Time": s.startTime ? new Date(s.startTime).toLocaleString("en-IN") : "TBA",
      "Duration (Mins)": s.duration,
      "Stage Type": s.stageType,
      "Enrolled Candidates": s.enrolledCount
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Festival Schedule");

    const filename = `${festName.replace(/\s+/g, "_")}_Schedule_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  // Hall of fame printable link
  const hallOfFamePrintUrl = `/print/hall-of-fame?eventId=${activeEventId}&categoryId=${candidateCategoryFilter}&teamId=${candidateTeamFilter}&minPoints=${candidateMinPointsFilter}&status=${candidateStatusFilter}`;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "4rem" }}>
      {/* ─── PAGE HEADER & EVENT SWITCHER ─── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.5rem" }}>📊</span>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: "800", letterSpacing: "-0.5px" }}>
              Official Reports & Printables Hub
            </h1>
          </div>
          <p className="page-description" style={{ marginBottom: 0 }}>
            Generate executive reports, download formatted Excel spreadsheets, and print official PDF documents for {festName}.
          </p>
        </div>

        {events.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "600" }}>
              Festival Event:
            </label>
            <select
              value={activeEventId}
              onChange={(e) => {
                window.location.href = `/dashboard/reports?eventId=${e.target.value}`;
              }}
              className="form-control"
              style={{ padding: "6px 12px", fontSize: "0.85rem", borderRadius: "8px", minWidth: "160px" }}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── QUICK STATS BANNER ─── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem"
        }}
      >
        <div className="glass-panel" style={{ padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(99, 102, 241, 0.12)", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Total Students</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "800" }}>{stats.totalStudents}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={22} />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Star of the Fest</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {stats.topStar ? stats.topStar.name : "Evaluating"}
            </div>
            {stats.topStar && stats.topStar.netPointsPublished > 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: "bold" }}>
                {stats.topStar.netPointsPublished} pts ({stats.topStar.teamName})
              </span>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={22} />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Leading Team</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
              {stats.topTeam ? stats.topTeam.name : "No Data"}
            </div>
            {stats.topTeam && (
              <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: "bold" }}>
                {stats.topTeam.netPoints} pts
              </span>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: "600" }}>Programs Evaluated</div>
            <div style={{ fontSize: "1.3rem", fontWeight: "800" }}>
              {stats.evaluatedPrograms} / {stats.totalPrograms}
            </div>
          </div>
        </div>
      </div>

      {/* ─── TAB NAVIGATION ─── */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1.5rem",
          overflowX: "auto",
          paddingBottom: "4px"
        }}
      >
        <button
          onClick={() => setActiveTab("hall")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            color: activeTab === "hall" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "hall" ? "2px solid var(--primary)" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <Star size={16} />
          <span>Hall of Fame (Student Points)</span>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "999px",
              backgroundColor: activeTab === "hall" ? "var(--primary)" : "rgba(255,255,255,0.08)",
              color: activeTab === "hall" ? "#fff" : "var(--text-muted)"
            }}
          >
            {candidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("teams")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            color: activeTab === "teams" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "teams" ? "2px solid var(--primary)" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <Trophy size={16} />
          <span>Team Championship</span>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "999px",
              backgroundColor: activeTab === "teams" ? "var(--primary)" : "rgba(255,255,255,0.08)",
              color: activeTab === "teams" ? "#fff" : "var(--text-muted)"
            }}
          >
            {teamsStandings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("results")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            color: activeTab === "results" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "results" ? "2px solid var(--primary)" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <FileText size={16} />
          <span>Master Program Results</span>
          <span
            style={{
              fontSize: "0.75rem",
              padding: "2px 8px",
              borderRadius: "999px",
              backgroundColor: activeTab === "results" ? "var(--primary)" : "rgba(255,255,255,0.08)",
              color: activeTab === "results" ? "#fff" : "var(--text-muted)"
            }}
          >
            {programResults.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("candidates")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            color: activeTab === "candidates" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "candidates" ? "2px solid var(--primary)" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <Users size={16} />
          <span>Candidates Directory</span>
        </button>

        <button
          onClick={() => setActiveTab("schedule")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            color: activeTab === "schedule" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "schedule" ? "2px solid var(--primary)" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <Calendar size={16} />
          <span>Schedule & Venue Roster</span>
        </button>

        <button
          onClick={() => setActiveTab("printCenter")}
          style={{
            padding: "10px 18px",
            border: "none",
            background: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            color: activeTab === "printCenter" ? "var(--primary)" : "var(--text-muted)",
            borderBottom: activeTab === "printCenter" ? "2px solid var(--primary)" : "2px solid transparent",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            whiteSpace: "nowrap"
          }}
        >
          <Printer size={16} />
          <span>Print Center (All PDFs)</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: HALL OF FAME (STUDENT STANDINGS)                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "hall" && (
        <div>
          {/* Controls & Filter Bar */}
          <div
            className="glass-panel"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              marginBottom: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "14px"
            }}
          >
            {/* Top row: Search & Action buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px" }}>
                <Search
                  size={16}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)"
                  }}
                />
                <input
                  type="text"
                  placeholder="Search student by name, chest number, or team..."
                  value={candidateSearchQuery}
                  onChange={(e) => setCandidateSearchQuery(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: "36px", fontSize: "0.875rem", borderRadius: "8px", width: "100%" }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={exportHallOfFameExcel}
                  className="btn"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    borderColor: "#10b981",
                    fontSize: "0.85rem",
                    padding: "8px 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: "600"
                  }}
                >
                  <Download size={16} />
                  <span>Download Excel (.xlsx)</span>
                </button>

                <a
                  href={hallOfFamePrintUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    fontSize: "0.85rem",
                    padding: "8px 16px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: "600"
                  }}
                >
                  <Printer size={16} />
                  <span>Print / Save PDF</span>
                </a>
              </div>
            </div>

            {/* Bottom row: Filter Dropdowns */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Category:</span>
                <select
                  value={candidateCategoryFilter}
                  onChange={(e) => setCandidateCategoryFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Team:</span>
                <select
                  value={candidateTeamFilter}
                  onChange={(e) => setCandidateTeamFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="ALL">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Show:</span>
                <select
                  value={candidateMinPointsFilter}
                  onChange={(e) => setCandidateMinPointsFilter(e.target.value as "scorers" | "all")}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="scorers">Students With Points (&gt; 0)</option>
                  <option value="all">All Registered Students</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Score Type:</span>
                <select
                  value={candidateStatusFilter}
                  onChange={(e) => setCandidateStatusFilter(e.target.value as "published" | "all")}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="published">Published Standings Only</option>
                  <option value="all">All (Including Draft Marks)</option>
                </select>
              </div>

              <div style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Showing <strong>{filteredCandidates.length}</strong> students
              </div>
            </div>
          </div>

          {/* Hall of Fame Data Table */}
          <div className="glass-panel" style={{ borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "70px" }}>Rank</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "90px" }}>Chest #</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Student</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Team</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "12px 12px", textAlign: "center", width: "90px" }}>1st / 2nd / 3rd</th>
                    <th style={{ padding: "12px 12px", textAlign: "center", width: "90px" }}>A / B Grade</th>
                    <th style={{ padding: "12px 12px", textAlign: "center", width: "80px" }}>Programs</th>
                    <th style={{ padding: "12px 12px", textAlign: "center", width: "70px" }}>Penalty</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", width: "120px" }}>Achieved Points</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "90px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCandidates.map((cand, idx) => {
                    const displayRank =
                      candidateCategoryFilter !== "ALL" ? cand.categoryRank : cand.overallRank;
                    const pts =
                      candidateStatusFilter === "published"
                        ? cand.netPointsPublished
                        : cand.netPointsTotal;
                    const isTop1 = displayRank === 1 && pts > 0;
                    const isTop2 = displayRank === 2 && pts > 0;
                    const isTop3 = displayRank === 3 && pts > 0;

                    return (
                      <tr
                        key={cand.id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          backgroundColor: isTop1
                            ? "rgba(251, 191, 36, 0.05)"
                            : idx % 2 === 0
                            ? "transparent"
                            : "rgba(255, 255, 255, 0.015)",
                          transition: "background-color 0.15s ease"
                        }}
                      >
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          {isTop1 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                backgroundColor: "#fbbf24",
                                color: "#000",
                                fontWeight: "800",
                                fontSize: "0.85rem",
                                boxShadow: "0 0 10px rgba(251, 191, 36, 0.5)"
                              }}
                            >
                              1
                            </span>
                          ) : isTop2 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                backgroundColor: "#9ca3af",
                                color: "#000",
                                fontWeight: "800",
                                fontSize: "0.85rem"
                              }}
                            >
                              2
                            </span>
                          ) : isTop3 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "26px",
                                height: "26px",
                                borderRadius: "50%",
                                backgroundColor: "#d97706",
                                color: "#fff",
                                fontWeight: "800",
                                fontSize: "0.85rem"
                              }}
                            >
                              3
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontWeight: "600" }}>
                              {displayRank || idx + 1}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          {cand.chestNumber ? (
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontWeight: "700",
                                backgroundColor: "rgba(255,255,255,0.06)",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                border: "1px solid var(--border-color)",
                                fontSize: "0.85rem"
                              }}
                            >
                              #{cand.chestNumber}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>-</span>
                          )}
                        </td>

                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {cand.photo ? (
                              <img
                                src={cand.photo}
                                alt={cand.name}
                                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  borderRadius: "50%",
                                  backgroundColor: cand.teamColor || "var(--primary)",
                                  color: "#fff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "bold",
                                  fontSize: "0.8rem"
                                }}
                              >
                                {cand.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: "600", color: "var(--text-primary)" }}>{cand.name}</div>
                              {isTop1 && (
                                <span style={{ fontSize: "0.7rem", color: "#fbbf24", fontWeight: "bold" }}>
                                  👑 Ranked #1 Champion
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span
                              style={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: cand.teamColor || "#6366f1"
                              }}
                            />
                            <span>{cand.teamName}</span>
                          </div>
                        </td>

                        <td style={{ padding: "10px 14px" }}>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid var(--border-color)"
                            }}
                          >
                            {cand.categoryName}
                          </span>
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: "4px", fontSize: "0.8rem" }}>
                            <span style={{ color: cand.rank1Count > 0 ? "#fbbf24" : "var(--text-muted)", fontWeight: cand.rank1Count > 0 ? "bold" : "normal" }}>
                              {cand.rank1Count}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>/</span>
                            <span style={{ color: cand.rank2Count > 0 ? "#9ca3af" : "var(--text-muted)", fontWeight: cand.rank2Count > 0 ? "bold" : "normal" }}>
                              {cand.rank2Count}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>/</span>
                            <span style={{ color: cand.rank3Count > 0 ? "#d97706" : "var(--text-muted)", fontWeight: cand.rank3Count > 0 ? "bold" : "normal" }}>
                              {cand.rank3Count}
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: "4px", fontSize: "0.8rem" }}>
                            <span style={{ color: cand.gradeACount > 0 ? "var(--success)" : "var(--text-muted)", fontWeight: cand.gradeACount > 0 ? "bold" : "normal" }}>
                              {cand.gradeACount}A
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>/</span>
                            <span style={{ color: cand.gradeBCount > 0 ? "var(--secondary)" : "var(--text-muted)", fontWeight: cand.gradeBCount > 0 ? "bold" : "normal" }}>
                              {cand.gradeBCount}B
                            </span>
                          </div>
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                            {cand.programs.length}
                          </span>
                        </td>

                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {cand.individualPenalties > 0 ? (
                            <span style={{ color: "var(--error)", fontWeight: "bold", fontSize: "0.8rem" }}>
                              -{cand.individualPenalties}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>0</span>
                          )}
                        </td>

                        <td style={{ padding: "10px 16px", textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "1.05rem",
                              fontWeight: "800",
                              color: pts > 0 ? "var(--success)" : "var(--text-muted)"
                            }}
                          >
                            {pts} <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>pts</span>
                          </span>
                        </td>

                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <button
                            onClick={() => setSelectedCandidate(cand)}
                            className="btn btn-secondary"
                            style={{ padding: "4px 8px", fontSize: "0.75rem", borderRadius: "6px" }}
                            title="View individual program breakdown"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={11} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔍</div>
                        <div style={{ fontWeight: "600", marginBottom: "4px" }}>No students match the criteria</div>
                        <div style={{ fontSize: "0.85rem" }}>Try adjusting the category, team, or search filters above.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: TEAM CHAMPIONSHIP STANDINGS                            */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "teams" && (
        <div>
          <div
            className="glass-panel"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>Official Team Leaderboard</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Calculated across all individual, group, and general festival programs after penalty deductions.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={exportTeamStandingsExcel}
                className="btn"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  borderColor: "#10b981",
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Download size={16} />
                <span>Download Excel (.xlsx)</span>
              </button>

              <a
                href={`/print/team-standings?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Printer size={16} />
                <span>Print / Save PDF</span>
              </a>
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "70px" }}>Rank</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Team / House</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "90px" }}>Students</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "100px" }}>Individual</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "90px" }}>Group</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "90px" }}>General</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "90px" }}>Gross</th>
                    <th style={{ padding: "12px 14px", textAlign: "right", width: "90px" }}>Penalties</th>
                    <th style={{ padding: "12px 18px", textAlign: "right", width: "130px" }}>Net Score</th>
                  </tr>
                </thead>
                <tbody>
                  {teamsStandings.map((t, idx) => {
                    const isTop1 = t.rank === 1 && t.netPoints > 0;
                    return (
                      <tr
                        key={t.id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          backgroundColor: isTop1
                            ? "rgba(251, 191, 36, 0.05)"
                            : idx % 2 === 0
                            ? "transparent"
                            : "rgba(255, 255, 255, 0.015)"
                        }}
                      >
                        <td style={{ padding: "12px 16px", textAlign: "center" }}>
                          {isTop1 ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: "30px",
                                height: "30px",
                                borderRadius: "50%",
                                backgroundColor: "#fbbf24",
                                color: "#000",
                                fontWeight: "800",
                                fontSize: "0.9rem",
                                boxShadow: "0 0 10px rgba(251, 191, 36, 0.5)"
                              }}
                            >
                              1
                            </span>
                          ) : (
                            <span style={{ fontWeight: "700", color: "var(--text-muted)" }}>
                              {t.rank || idx + 1}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span
                              style={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "4px",
                                backgroundColor: t.flagColor || "#6366f1"
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: "700", fontSize: "1rem" }}>{t.name}</div>
                              {t.prefixCode && (
                                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                  Code: {t.prefixCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          {t.candidatesCount}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          {t.individualPoints}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          {t.groupPoints}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                          {t.generalPoints}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "right", color: "var(--text-muted)" }}>
                          {t.grossPoints}
                        </td>

                        <td style={{ padding: "12px 14px", textAlign: "right", color: t.penaltyPoints > 0 ? "var(--error)" : "var(--text-muted)" }}>
                          {t.penaltyPoints > 0 ? `-${t.penaltyPoints}` : "0"}
                        </td>

                        <td style={{ padding: "12px 18px", textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: "800",
                              color: t.netPoints > 0 ? "var(--success)" : "var(--text-primary)"
                            }}
                          >
                            {t.netPoints} <span style={{ fontSize: "0.8rem", fontWeight: "normal" }}>pts</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: MASTER PROGRAM RESULTS                                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "results" && (
        <div>
          <div
            className="glass-panel"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Category:</span>
                <select
                  value={resultsCategoryFilter}
                  onChange={(e) => setResultsCategoryFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Type:</span>
                <select
                  value={resultsTypeFilter}
                  onChange={(e) => setResultsTypeFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="ALL">All Types</option>
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="GROUP">Group</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={exportProgramResultsExcel}
                className="btn"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  borderColor: "#10b981",
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Download size={16} />
                <span>Download Excel (.xlsx)</span>
              </button>

              <a
                href={`/print/results?eventId=${activeEventId}&categoryId=${resultsCategoryFilter}&type=${resultsTypeFilter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Printer size={16} />
                <span>Print / Save PDF</span>
              </a>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {programResults
              .filter((p) => {
                if (resultsCategoryFilter !== "ALL" && p.categoryId !== resultsCategoryFilter) return false;
                if (resultsTypeFilter !== "ALL" && p.type !== resultsTypeFilter) return false;
                return true;
              })
              .map((prog) => (
                <div
                  key={prog.id}
                  className="glass-panel"
                  style={{ padding: "16px", borderRadius: "10px", border: "1px solid var(--border-color)" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h4 style={{ margin: 0, fontSize: "1.05rem" }}>{prog.name}</h4>
                        {prog.programCode && (
                          <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                            ({prog.programCode})
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            border: "1px solid var(--border-color)"
                          }}
                        >
                          {prog.categoryName}
                        </span>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            backgroundColor: prog.type === "INDIVIDUAL" ? "rgba(99, 102, 241, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: prog.type === "INDIVIDUAL" ? "#6366f1" : "#f59e0b"
                          }}
                        >
                          {prog.type}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        Venue: {prog.venue || "TBA"} · Enrolled: {prog.assignmentsCount} participants
                      </div>
                    </div>

                    <div>
                      {prog.isPublished ? (
                        <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: "600" }}>
                          Published
                        </span>
                      ) : prog.isEvaluated ? (
                        <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", fontWeight: "600" }}>
                          Draft Evaluated
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.75rem", padding: "4px 10px", borderRadius: "999px", backgroundColor: "rgba(255, 255, 255, 0.05)", color: "var(--text-muted)" }}>
                          Pending Scoring
                        </span>
                      )}
                    </div>
                  </div>

                  {prog.winners.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "10px" }}>
                      {prog.winners.map((w, wIdx) => (
                        <div
                          key={wIdx}
                          style={{
                            flex: "1 1 200px",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid var(--border-color)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <span
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: "800",
                                  padding: "1px 6px",
                                  borderRadius: "4px",
                                  backgroundColor: w.rank === 1 ? "#fbbf24" : w.rank === 2 ? "#9ca3af" : "#d97706",
                                  color: "#000"
                                }}
                              >
                                {w.rank ? `${w.rank}` : "-"}
                              </span>
                              <strong style={{ fontSize: "0.85rem" }}>
                                {w.candidateName || w.teamName}
                              </strong>
                              {w.chestNumber && (
                                <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                                  #{w.chestNumber}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              {w.teamName} {w.grade && `· Grade ${w.grade}`}
                            </div>
                          </div>

                          <div style={{ fontWeight: "700", color: "var(--success)", fontSize: "0.9rem" }}>
                            {w.points} pts
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "6px" }}>
                      No results entered yet for this program.
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 4: CANDIDATES DIRECTORY                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "candidates" && (
        <div>
          <div
            className="glass-panel"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Team:</span>
                <select
                  value={directoryTeamFilter}
                  onChange={(e) => setDirectoryTeamFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="ALL">All Teams</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Category:</span>
                <select
                  value={directoryCategoryFilter}
                  onChange={(e) => setDirectoryCategoryFilter(e.target.value)}
                  className="form-control"
                  style={{ padding: "6px 10px", fontSize: "0.8rem", borderRadius: "6px" }}
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={exportCandidateDirectoryExcel}
                className="btn"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  borderColor: "#10b981",
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Download size={16} />
                <span>Download Excel (.xlsx)</span>
              </button>

              <a
                href={`/print/candidates?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Printer size={16} />
                <span>Print Candidate List</span>
              </a>
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "90px" }}>Chest #</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Candidate Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Team / House</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "120px" }}>Programs</th>
                    <th style={{ padding: "12px 14px", textAlign: "center", width: "120px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidateDirectory
                    .filter((c) => {
                      if (directoryTeamFilter !== "ALL" && c.teamId !== directoryTeamFilter) return false;
                      if (directoryCategoryFilter !== "ALL" && c.categoryId !== directoryCategoryFilter) return false;
                      return true;
                    })
                    .map((cand, idx) => (
                      <tr
                        key={cand.id}
                        style={{
                          borderBottom: "1px solid var(--border-color)",
                          backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)"
                        }}
                      >
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontWeight: "700",
                              backgroundColor: "rgba(255,255,255,0.06)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              border: "1px solid var(--border-color)"
                            }}
                          >
                            {cand.chestNumber ? `#${cand.chestNumber}` : "-"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 16px", fontWeight: "600" }}>{cand.name}</td>
                        <td style={{ padding: "10px 16px" }}>{cand.teamName}</td>
                        <td style={{ padding: "10px 14px" }}>{cand.categoryName}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>{cand.programsCount}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          {cand.isApproved ? (
                            <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: "600" }}>
                              Approved
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.75rem", color: "var(--warning)" }}>
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 5: FESTIVAL SCHEDULE & VENUE ROSTER                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "schedule" && (
        <div>
          <div
            className="glass-panel"
            style={{
              padding: "16px",
              borderRadius: "12px",
              border: "1px solid var(--border-color)",
              marginBottom: "1.25rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px"
            }}
          >
            <div>
              <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>Master Festival Timetable</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Export schedule and print official stage manager / venue sheets.
              </p>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={exportScheduleExcel}
                className="btn"
                style={{
                  backgroundColor: "rgba(16, 185, 129, 0.15)",
                  color: "#10b981",
                  borderColor: "#10b981",
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Download size={16} />
                <span>Download Excel (.xlsx)</span>
              </button>

              <a
                href={`/print/schedule?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{
                  fontSize: "0.85rem",
                  padding: "8px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600"
                }}
              >
                <Printer size={16} />
                <span>Print Schedule</span>
              </a>
            </div>
          </div>

          <div className="glass-panel" style={{ borderRadius: "12px", border: "1px solid var(--border-color)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "12px 14px", textAlign: "left", width: "160px" }}>Time</th>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>Program Name</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Category</th>
                    <th style={{ padding: "12px 14px", textAlign: "left" }}>Venue / Stage</th>
                    <th style={{ padding: "12px 12px", textAlign: "center", width: "100px" }}>Stage Type</th>
                    <th style={{ padding: "12px 12px", textAlign: "center", width: "90px" }}>Duration</th>
                    <th style={{ padding: "12px 12px", textAlign: "center", width: "90px" }}>Enrolled</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item, idx) => (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid var(--border-color)",
                        backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.015)"
                      }}
                    >
                      <td style={{ padding: "10px 14px", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                        {item.startTime ? new Date(item.startTime).toLocaleString("en-IN", { hour: "numeric", minute: "numeric", hour12: true, day: "numeric", month: "short" }) : "TBA"}
                      </td>
                      <td style={{ padding: "10px 16px", fontWeight: "600" }}>{item.name}</td>
                      <td style={{ padding: "10px 14px" }}>{item.categoryName}</td>
                      <td style={{ padding: "10px 14px" }}>{item.venue || "TBA"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.stageType}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.duration}m</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>{item.enrolledCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 6: OFFICIAL PRINT CENTER (QUICK PDF DESK)                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "printCenter" && (
        <div>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.2rem" }}>Official Printable Desk</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              One-click access to all official, print-formatted festival documents with official headers, seal, and signature lines.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.25rem"
            }}
          >
            {/* 1. Hall of Fame Sheet */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>👑</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Hall of Fame & Student Standings</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Complete ranked student list with individual programs won, ranks, grades, and total points. Filterable by category or team.
                </p>
              </div>
              <a
                href={hallOfFamePrintUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Hall of Fame PDF</span>
              </a>
            </div>

            {/* 2. Team Standings Sheet */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🏆</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Team Championship Leaderboard</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Official declaration sheet with overall scores, category-wise breakdown, penalties, and house rankings.
                </p>
              </div>
              <a
                href={`/print/team-standings?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Team Standings PDF</span>
              </a>
            </div>

            {/* 3. Category Results Sheet */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>📜</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Published Competition Results</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Detailed program-by-program result sheets showing 1st, 2nd, and 3rd winners with grades and marks.
                </p>
              </div>
              <a
                href={`/print/results?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Results Sheet PDF</span>
              </a>
            </div>

            {/* 4. Approved Candidates List */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>👤</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Approved Candidate Chest Number Roll</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Master register of all registered candidates sorted by team and chest numbers for verification.
                </p>
              </div>
              <a
                href={`/print/candidates?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Candidates PDF</span>
              </a>
            </div>

            {/* 5. Master Schedule */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>📅</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Official Festival Schedule</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Complete timeline with venue assignments, timing, and category information for notice boards.
                </p>
              </div>
              <a
                href={`/print/schedule?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Schedule PDF</span>
              </a>
            </div>

            {/* 6. Judges Score Sheets */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>📝</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Judges Tabulation Sheets</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Official evaluation score sheets with candidate code slots, mark boxes, and judge sign blocks.
                </p>
              </div>
              <a
                href={`/print/judges-sheet?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Tabulation Sheets</span>
              </a>
            </div>

            {/* 7. Stage Manager Duty Sheet */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🎭</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Stage Manager Duty Sheet</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Program line-up sheet for stage coordinators with participant call slots and durations.
                </p>
              </div>
              <a
                href={`/print/stage-manager?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Stage Manager Sheet</span>
              </a>
            </div>

            {/* 8. Venue & Stage Layout */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>📍</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Venue & Stage Allocation</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Venue-wise event distribution for facility coordinators and control room management.
                </p>
              </div>
              <a
                href={`/print/venue?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Venue Allocation</span>
              </a>
            </div>

            {/* 9. Bulk ID Cards */}
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <span style={{ fontSize: "1.5rem" }}>🪪</span>
                  <h4 style={{ margin: 0, fontSize: "1.05rem" }}>Candidate Identity Cards</h4>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1rem", lineHeight: "1.5" }}>
                  Batch printable participant ID cards with chest numbers, photo placeholders, and QR credentials.
                </p>
              </div>
              <a
                href={`/print/id-cards?eventId=${activeEventId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} />
                <span>Print Candidate ID Cards</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* CANDIDATE SCORE BREAKDOWN MODAL                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {selectedCandidate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "1rem"
          }}
          onClick={() => setSelectedCandidate(null)}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "600px",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: "1.5rem",
              borderRadius: "16px",
              border: "1px solid var(--border-color)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {selectedCandidate.photo ? (
                  <img
                    src={selectedCandidate.photo}
                    alt={selectedCandidate.name}
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: selectedCandidate.teamColor || "var(--primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "1.2rem"
                    }}
                  >
                    {selectedCandidate.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 style={{ margin: "0 0 2px 0", fontSize: "1.25rem" }}>
                    {selectedCandidate.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    {selectedCandidate.chestNumber && (
                      <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>
                        #{selectedCandidate.chestNumber}
                      </span>
                    )}
                    <span>·</span>
                    <span style={{ color: selectedCandidate.teamColor || "var(--primary)" }}>
                      {selectedCandidate.teamName}
                    </span>
                    <span>·</span>
                    <span>{selectedCandidate.categoryName}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedCandidate(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "4px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Score Summary Box */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "10px",
                padding: "12px",
                borderRadius: "10px",
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-color)",
                marginBottom: "1.25rem",
                textAlign: "center"
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Overall Rank</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fbbf24" }}>
                  #{selectedCandidate.overallRank}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Category Rank</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--secondary)" }}>
                  #{selectedCandidate.categoryRank}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Total Points</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--success)" }}>
                  {candidateStatusFilter === "published"
                    ? selectedCandidate.netPointsPublished
                    : selectedCandidate.netPointsTotal}{" "}
                  pts
                </div>
              </div>
            </div>

            {/* Program-wise breakdown */}
            <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem" }}>
              Individual Programs Evaluated ({selectedCandidate.programs.length})
            </h4>

            {selectedCandidate.programs.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {selectedCandidate.programs.map((prog, pIdx) => (
                  <div
                    key={pIdx}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                      border: "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "0.9rem" }}>{prog.programName}</div>
                      <div style={{ display: "flex", gap: "8px", marginTop: "3px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        <span>Rank: {prog.rank ? `${prog.rank}` : "-"}</span>
                        <span>·</span>
                        <span>Grade: {prog.grade || "-"}</span>
                        <span>·</span>
                        <span>Marks: {prog.marks}</span>
                        <span>·</span>
                        <span style={{ color: prog.isPublished ? "var(--success)" : "var(--warning)" }}>
                          {prog.isPublished ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontWeight: "800", color: "var(--success)", fontSize: "1rem" }}>
                      +{prog.points} pts
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                No individual programs scored yet for this student.
              </div>
            )}

            {/* Disciplinary Penalties */}
            {selectedCandidate.individualPenalties > 0 && (
              <div
                style={{
                  marginTop: "1rem",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span style={{ fontSize: "0.85rem", color: "#f87171", fontWeight: "600" }}>
                  Disciplinary Penalty Deduction
                </span>
                <span style={{ fontWeight: "800", color: "#f87171" }}>
                  -{selectedCandidate.individualPenalties} pts
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
