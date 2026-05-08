"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkImportPrograms } from "./actions";

export default function ProgramBulkActions({ eventId, programs, categories }: { eventId: string, programs: any[], categories: any[] }) {
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleExport = () => {
    const exportData = programs.map(p => ({
      "Program Code": p.programCode || "",
      "Name": p.name,
      "Type": p.type,
      "Category": p.category?.name || "General",
      "Duration": p.duration,
      "Candidate Limit": p.candidateLimitPerTeam,
      "Event": p.event.name
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Programs");
    XLSX.writeFile(wb, `Programs_${new Date().toLocaleDateString()}.xlsx`);
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

        // Map Excel data to our structure
        const mappedPrograms = data.map((row: any) => {
          // Find category ID by name
          const catName = row["Category"] || row["category"] || "";
          const category = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          
          return {
            programCode: row["Program Code"] || row["Code"] || row["code"] || null,
            name: row["Name"] || row["name"] || row["Program Name"] || "",
            type: (row["Type"] || row["type"] || "INDIVIDUAL").toUpperCase(),
            categoryId: category?.id || null,
            candidateLimitPerTeam: row["Candidate Limit"] || row["Limit"] || 1,
            duration: row["Duration"] || 10
          };
        });

        // Validate
        const invalid = mappedPrograms.filter(p => !p.name);
        if (invalid.length > 0) {
          setError(`${invalid.length} programs are missing a name. Please check your file.`);
          setImporting(false);
          return;
        }

        const result = await bulkImportPrograms(eventId, mappedPrograms);
        if (result.success) {
          setSuccess(`Successfully imported ${result.count} programs!`);
        } else {
          setError(result.error || "Failed to import programs.");
        }
      } catch (err) {
        console.error(err);
        setError("Error reading Excel file. Make sure it's a valid .xlsx file.");
      }
      setImporting(false);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = () => {
    const template = [
      {
        "Program Code": "P101",
        "Name": "Example Program",
        "Type": "INDIVIDUAL",
        "Category": categories[0]?.name || "Junior",
        "Duration": 10,
        "Candidate Limit": 1
      }
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Programs_Import_Template.xlsx");
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h3 style={{ margin: 0 }}>Bulk Actions</h3>
        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button onClick={downloadTemplate} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            📥 Template
          </button>
          <button onClick={handleExport} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
            📤 Export Excel
          </button>
        </div>
      </div>

      <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', textAlign: 'center' }}>
        {importing ? (
          <div style={{ color: 'var(--primary)', fontWeight: 600 }}>⌛ Processing your file...</div>
        ) : (
          <>
            <input 
              type="file" 
              id="excel-upload" 
              hidden 
              accept=".xlsx, .xls" 
              onChange={handleFileUpload}
            />
            <label htmlFor="excel-upload" style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
              <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Click to Upload Excel</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Import all programs in one go. Support for codes, names, and types.
              </div>
            </label>
          </>
        )}
      </div>

      {error && (
        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}>
          ✅ {success}
        </div>
      )}
    </div>
  );
}
