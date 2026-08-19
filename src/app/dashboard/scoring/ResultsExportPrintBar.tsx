"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface ExportAndPrintModalProps {
  eventId: string;
  eventName: string;
  categories: { id: string; name: string }[];
  results: any[];
}

export default function ResultsExportPrintBar({
  eventId,
  eventName,
  categories,
  results
}: ExportAndPrintModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"published" | "all">("published");

  // Filter results for Excel Export based on active dropdown selections
  const filteredResults = results.filter(r => {
    // Status Filter
    if (statusFilter === "published" && !r.isPublished) return false;

    // Program Category Filter
    if (selectedCategory !== "ALL") {
      if (selectedCategory === "GENERAL") {
        if (r.program?.type !== "GENERAL" && r.program?.categoryId !== null) return false;
      } else {
        if (r.program?.categoryId !== selectedCategory && r.candidate?.categoryId !== selectedCategory) {
          return false;
        }
      }
    }

    // Program Type Filter
    if (selectedType !== "ALL") {
      if (r.program?.type !== selectedType) return false;
    }

    return true;
  });

  const handleExportExcel = () => {
    if (filteredResults.length === 0) {
      alert("No results match your selected filter to export.");
      return;
    }

    const data = filteredResults.map((r, idx) => ({
      "SL No": idx + 1,
      "Event": eventName,
      "Program": r.program?.name || "Unknown Program",
      "Category": r.program?.category?.name || (r.program?.type === "GENERAL" ? "General" : "All"),
      "Type": r.program?.type || "INDIVIDUAL",
      "Rank": r.rank ? `${r.rank}${getOrdinal(r.rank)}` : "-",
      "Grade": r.grade || "-",
      "Chest No": r.candidate?.chestNumber || "-",
      "Participant / Candidate": r.candidate?.name || r.team?.name || "Participant",
      "Team": r.candidate?.team?.name || r.team?.name || "-",
      "Points": r.points || 0,
      "Status": r.isPublished ? "Published" : "Draft"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Fest Results");

    const categoryLabel = selectedCategory === "ALL" ? "All_Categories" : selectedCategory === "GENERAL" ? "General" : (categories.find(c => c.id === selectedCategory)?.name?.replace(/\s+/g, "_") || "Category");
    const filename = `${eventName.replace(/\s+/g, "_")}_Results_${categoryLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const printUrl = `/print/results?eventId=${eventId}&categoryId=${selectedCategory}&type=${selectedType}&status=${statusFilter}`;

  return (
    <div className="glass-panel" style={{ 
      padding: "12px 18px", 
      marginBottom: "var(--spacing-md)", 
      display: "flex", 
      flexWrap: "wrap", 
      alignItems: "center", 
      justifyContent: "space-between",
      gap: "12px",
      borderRadius: "12px",
      border: "1px solid var(--border-color)",
      background: "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)"
    }}>
      {/* Filter Selectors */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
          <span>🔍 Filter:</span>
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="form-select"
          style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontWeight: 600 }}
        >
          <option value="ALL">📁 All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value="GENERAL">General Programs</option>
        </select>

        {/* Program Type Dropdown */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="form-select"
          style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontWeight: 600 }}
        >
          <option value="ALL">🏷️ All Types</option>
          <option value="INDIVIDUAL">Individual</option>
          <option value="GROUP">Group</option>
          <option value="GENERAL">General</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="form-select"
          style={{ padding: "6px 12px", fontSize: "0.82rem", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border-color)", color: "var(--text-primary)", fontWeight: 600 }}
        >
          <option value="published">✅ Published Only</option>
          <option value="all">📝 All (Published & Draft)</option>
        </select>
      </div>

      {/* Action Buttons: Print & Excel */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        {/* Print Filtered Results Button */}
        <a
          href={printUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{
            padding: "6px 14px",
            fontSize: "0.82rem",
            fontWeight: 700,
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            color: "#3b82f6",
            border: "1.5px solid #3b82f6",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
            cursor: "pointer"
          }}
        >
          🖨️ Print Result Sheet
        </a>

        {/* Excel Export Button */}
        <button
          onClick={handleExportExcel}
          className="btn"
          style={{
            padding: "6px 14px",
            fontSize: "0.82rem",
            fontWeight: 700,
            backgroundColor: "rgba(16, 185, 129, 0.12)",
            color: "#10b981",
            border: "1.5px solid #10b981",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer"
          }}
        >
          📊 Export to Excel ({filteredResults.length})
        </button>
      </div>
    </div>
  );
}
