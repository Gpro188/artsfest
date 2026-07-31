"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkImportCandidates } from "./actions";

export default function CandidateBulkActions({ teams, categories }: { teams: any[], categories: any[] }) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const downloadTemplate = () => {
    const template = [
      {
        "Candidate Name": "Muhammad Ali",
        "Team": teams[0]?.name || "Alpha Team",
        "Category": categories[0]?.name || "Senior",
        "Chest Number": "A101"
      },
      {
        "Candidate Name": "Fathima Riya",
        "Team": teams[0]?.name || "Alpha Team",
        "Category": categories[1]?.name || categories[0]?.name || "Junior",
        "Chest Number": "A102"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates_Template");
    XLSX.writeFile(wb, "Candidates_Import_Template.xlsx");
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

          const team = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase());
          const category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());

          return {
            name: (row["Candidate Name"] || row["Name"] || row["name"] || "").toString().trim(),
            teamId: team?.id || "",
            categoryId: category?.id || "",
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
          setError(`Could not find team matching "${missingTeam[0].rawTeam}". Make sure team names match your created teams exact spelling.`);
          setImporting(false);
          return;
        }

        const missingCat = mappedCandidates.filter(c => !c.categoryId);
        if (missingCat.length > 0) {
          setError(`Could not find category matching "${missingCat[0].rawCategory}". Make sure category names match your created categories exact spelling.`);
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
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Download sample template, fill candidate list, and upload in bulk.</p>
        </div>
        <button onClick={downloadTemplate} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📥 Download Template Excel
        </button>
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
              <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1rem' }}>Click to Upload Candidates Excel</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supports candidate names, team names, categories, and optional chest numbers.
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
