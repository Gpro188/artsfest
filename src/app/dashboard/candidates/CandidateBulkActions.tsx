"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkImportCandidates, bulkApproveUnapprovedCandidates } from "./actions";

export default function CandidateBulkActions({ teams, categories }: { teams: any[], categories: any[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [importing, setImporting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];

  const handleBulkApprove = async () => {
    if (!confirm("Are you sure you want to approve all pending candidates and auto-generate their chest numbers?")) return;
    setApproving(true);
    setError("");
    setSuccess("");
    const res = await bulkApproveUnapprovedCandidates();
    if (res.success) {
      setSuccess(`Successfully approved ${res.count} candidates & assigned chest numbers!`);
      window.location.reload();
    } else {
      setError(res.error || "Failed to bulk approve candidates.");
    }
    setApproving(false);
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Candidate Name": "Muhammad Ali",
        "Team": selectedTeam?.name || teams[0]?.name || "Alpha Team",
        "Category": selectedCategory?.name || categories[0]?.name || "Senior",
        "Chest Number": "A101"
      },
      {
        "Candidate Name": "Fathima Riya",
        "Team": selectedTeam?.name || teams[0]?.name || "Alpha Team",
        "Category": selectedCategory?.name || categories[0]?.name || "Senior",
        "Chest Number": "A102"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates_Template");
    XLSX.writeFile(wb, `Candidates_Template_${selectedTeam?.name?.replace(/\s+/g, '_') || 'Fest'}.xlsx`);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError("");
    setSuccess("");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setError("The Excel file is empty.");
          setImporting(false);
          return;
        }

        const mappedCandidates = data.map((row: any) => {
          const teamName = (row["Team"] || row["team"] || row["Team Name"] || "").toString().trim();
          const catName = (row["Category"] || row["category"] || row["Category Name"] || "").toString().trim();

          // Use Excel value first, fallback to user selected dropdown defaults
          const team = teamName ? teams.find(t => t.name.toLowerCase() === teamName.toLowerCase()) : selectedTeam;
          const category = catName ? categories.find(c => c.name.toLowerCase() === catName.toLowerCase()) : selectedCategory;

          return {
            name: (row["Candidate Name"] || row["Name"] || row["name"] || "").toString().trim(),
            teamId: team?.id || selectedTeamId,
            categoryId: category?.id || selectedCategoryId,
            chestNumber: (row["Chest Number"] || row["chestNumber"] || "").toString().trim() || undefined,
            rawTeam: teamName,
            rawCategory: catName
          };
        });

        // Validation checks
        const missingName = mappedCandidates.filter(c => !c.name);
        if (missingName.length > 0) {
          setError(`${missingName.length} candidates are missing names. Please check your Excel file.`);
          setImporting(false);
          return;
        }

        const missingTeam = mappedCandidates.filter(c => !c.teamId);
        if (missingTeam.length > 0) {
          setError(`Could not find team matching "${missingTeam[0].rawTeam}". Please select a default team in the dropdown above or check spelling.`);
          setImporting(false);
          return;
        }

        const missingCat = mappedCandidates.filter(c => !c.categoryId);
        if (missingCat.length > 0) {
          setError(`Could not find category matching "${missingCat[0].rawCategory}". Please select a default category in the dropdown above or check spelling.`);
          setImporting(false);
          return;
        }

        const result = await bulkImportCandidates(mappedCandidates);
        if (result.success) {
          setSuccess(`Successfully imported ${result.count} candidates!`);
        } else {
          setError(result.error || "Failed to import candidates.");
        }
      } catch (err) {
        console.error(err);
        setError("Error reading Excel file. Make sure it's a valid .xlsx file.");
      }
      setImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <div>
          <h3 style={{ margin: 0 }}>Candidate Excel Upload & Bulk Actions</h3>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Select team & category presets, download pre-filled Excel template, and upload in bulk.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleBulkApprove} disabled={approving} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 14px', backgroundColor: 'var(--success)', color: 'white', border: 'none' }}>
            {approving ? "Approving..." : "⚡ 1-Click Approve All Pending"}
          </button>
          <button onClick={downloadTemplate} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 Download Template Excel
          </button>
        </div>
      </div>

      {/* Preset Target Selection Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        {teams.length > 0 && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px', fontWeight: 600 }}>Default Target Team:</label>
            <select 
              className="form-input" 
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
            >
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {categories.length > 0 && (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px', fontWeight: 600 }}>Default Target Category:</label>
            <select 
              className="form-input" 
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', textAlign: 'center', backgroundColor: 'var(--surface-color)' }}>
        {importing ? (
          <div style={{ color: 'var(--primary)', fontWeight: 600 }}>⌛ Processing candidate file...</div>
        ) : (
          <>
            <input 
              type="file" 
              id="candidate-excel-upload" 
              hidden 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
            />
            <label htmlFor="candidate-excel-upload" style={{ cursor: 'pointer', display: 'block' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👨‍🎓📊</div>
              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1rem' }}>
                Click to Upload Candidates Excel
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Fills target Team ({selectedTeam?.name || 'Selected'}) & Category ({selectedCategory?.name || 'Selected'}) automatically if left blank in file.
              </div>
            </label>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          ✅ {success}
        </div>
      )}
    </div>
  );
}
