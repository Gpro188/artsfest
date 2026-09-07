"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { 
  validateCandidatesImport, 
  bulkImportCandidates, 
  bulkApproveUnapprovedCandidates,
  type ImportValidationError 
} from "./actions";

export default function CandidateBulkActions({ teams, categories }: { teams: any[], categories: any[] }) {
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id || "");
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Customization Options
  const [updateExisting, setUpdateExisting] = useState(true);
  const [autoGenerateIfBlank, setAutoGenerateIfBlank] = useState(true);

  // Validation report state
  const [validationData, setValidationData] = useState<{
    summary: {
      totalRows: number;
      validCount: number;
      errorCount: number;
      warningCount: number;
      duplicateCount: number;
      mismatchCount: number;
      missingCount: number;
    };
    categorizedErrors: {
      duplicateChestNumbers: ImportValidationError[];
      teamMismatches: ImportValidationError[];
      categoryMismatches: ImportValidationError[];
      missingFields: ImportValidationError[];
    };
    warnings: Array<{ row: number; name: string; message: string }>;
    validCandidates: any[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'ALL' | 'DUPLICATES' | 'TEAM_MISMATCH' | 'CAT_MISMATCH' | 'MISSING'>('ALL');

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
    // Sheet 1: Candidates Template
    const template = [
      {
        "Candidate Name": "Muhammad Ali",
        "Team": selectedTeam?.name || teams[0]?.name || "Alpha Team",
        "Category": selectedCategory?.name || categories[0]?.name || "Senior",
        "Chest Number": "101"
      },
      {
        "Candidate Name": "Fathima Riya",
        "Team": selectedTeam?.name || teams[0]?.name || "Alpha Team",
        "Category": selectedCategory?.name || categories[0]?.name || "Senior",
        "Chest Number": "102"
      },
      {
        "Candidate Name": "Ahmad Hassan",
        "Team": teams[1]?.name || "Beta Team",
        "Category": categories[1]?.name || "Junior",
        "Chest Number": "201"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);

    // Sheet 2: Reference List of valid Teams and Categories
    const refData: any[] = [];
    const maxLen = Math.max(teams.length, categories.length);
    for (let i = 0; i < maxLen; i++) {
      refData.push({
        "Valid Team Names (Copy exact)": teams[i]?.name || "",
        "Team Prefix": teams[i]?.prefixCode || "",
        "Valid Category Names (Copy exact)": categories[i]?.name || ""
      });
    }
    const wsRef = XLSX.utils.json_to_sheet(refData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Candidates_Template");
    XLSX.utils.book_append_sheet(wb, wsRef, "Teams_and_Categories_Guide");
    XLSX.writeFile(wb, `Candidates_Template_CustomChest_${selectedTeam?.name?.replace(/\s+/g, '_') || 'Fest'}.xlsx`);
  };

  // Helper to flexibly extract fields regardless of column header differences
  const extractRowData = (row: any) => {
    const keys = Object.keys(row);
    const findVal = (patterns: string[]) => {
      for (const pat of patterns) {
        const cleanPat = pat.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = keys.find(k => k.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === cleanPat);
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          const val = String(row[matchedKey]).trim();
          if (val) return val;
        }
      }
      return '';
    };

    const name = findVal(['Candidate Name', 'CandidateName', 'Name', 'Candidate', 'Student Name', 'Student', 'FullName', 'Full Name']);
    const chest = findVal(['Chest Number', 'ChestNumber', 'Chest No', 'ChestNo', 'Chest', 'C.No', 'CNo', 'Chest#', 'ChestNum', 'ChestCode', 'Chest Code', 'CHEST NUMBER', 'CHEST NO']);
    const team = findVal(['Team', 'Team Name', 'TeamName', 'Group', 'TeamCode']);
    const category = findVal(['Category', 'Category Name', 'CategoryName', 'Cat', 'Section', 'Division']);

    return { name, chest, team, category };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setValidating(true);
    setError("");
    setSuccess("");
    setValidationData(null);

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
          setValidating(false);
          return;
        }

        // Map rows with 1-based indexing (accounting for Excel header as row 1)
        const mappedRows = data.map((row: any, idx: number) => {
          const extracted = extractRowData(row);
          return {
            rowNumber: idx + 2, // Excel Row 2 onwards
            name: extracted.name,
            rawTeam: extracted.team,
            rawCategory: extracted.category,
            chestNumber: extracted.chest || undefined,
            defaultTeamId: selectedTeamId,
            defaultCategoryId: selectedCategoryId
          };
        }).filter(r => r.name || r.chestNumber || r.rawTeam || r.rawCategory); // Skip completely empty trailing lines

        if (mappedRows.length === 0) {
          setError("No candidate rows detected. Please check column headers (Candidate Name, Team, Category, Chest Number).");
          setValidating(false);
          return;
        }

        const res = await validateCandidatesImport(mappedRows, { updateExisting });
        if (!res.success) {
          setError(res.error || "Failed to validate candidate file.");
          setValidating(false);
          return;
        }

        setValidationData({
          summary: res.summary!,
          categorizedErrors: res.categorizedErrors!,
          warnings: res.warnings || [],
          validCandidates: res.validCandidates || []
        });

        // If completely valid, proceed immediately or give 1-click import
        if (res.isValid && res.validCandidates && res.validCandidates.length > 0) {
          setSuccess(`Validation Passed: All ${res.validCandidates.length} candidate rows are ready to import.`);
        }
      } catch (err: any) {
        console.error(err);
        setError("Error reading Excel file. Make sure it's a valid .xlsx or .xls file.");
      }
      setValidating(false);
    };
    reader.readAsBinaryString(file);
    e.target.value = ""; // Reset input
  };

  const handleExecuteImport = async (candidatesToImport: any[]) => {
    if (!candidatesToImport || candidatesToImport.length === 0) return;
    setImporting(true);
    setError("");
    setSuccess("");

    try {
      const res = await bulkImportCandidates(candidatesToImport, {
        updateExisting,
        autoGenerateIfBlank
      });

      if (res.success) {
        let msg = `Successfully processed ${res.total} candidates: `;
        const details = [];
        if (res.importedCount && res.importedCount > 0) details.push(`${res.importedCount} new imported`);
        if (res.updatedCount && res.updatedCount > 0) details.push(`${res.updatedCount} existing updated`);
        if (res.skippedCount && res.skippedCount > 0) details.push(`${res.skippedCount} skipped`);
        if (res.failedCount && res.failedCount > 0) details.push(`${res.failedCount} failed`);
        
        msg += details.join(", ");
        setSuccess(msg);
        setValidationData(null);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setError(res.error || "Failed to import candidates.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during candidate import.");
    }
    setImporting(false);
  };

  return (
    <div className="glass-panel" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-lg)' }}>
      {/* Header & Main Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👨‍🎓📊</span> Candidate Bulk Excel Import & Customized Chest Numbers
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Upload candidates with custom chest numbers, validate teams & categories, and detect duplicates with detailed error reports.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={handleBulkApprove} disabled={approving} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '6px 14px', backgroundColor: 'var(--success)', color: 'white', border: 'none' }}>
            {approving ? "Approving..." : "⚡ 1-Click Approve All Pending"}
          </button>
          <button onClick={downloadTemplate} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📥 Download Template Excel
          </button>
        </div>
      </div>

      {/* Preset Target Selection & Import Options */}
      <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
          {teams.length > 0 && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px', fontWeight: 600 }}>
                Default Team (used only if Team column is blank):
              </label>
              <select 
                className="form-input" 
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Prefix: {t.prefixCode || 'None'})</option>
                ))}
              </select>
            </div>
          )}

          {categories.length > 0 && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '2px', fontWeight: 600 }}>
                Default Category (used only if Category column is blank):
              </label>
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

        {/* Checkbox Options */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', fontSize: '0.82rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={updateExisting} 
              onChange={(e) => setUpdateExisting(e.target.checked)} 
            />
            <span>🔄 <strong>Update Existing Candidates</strong> (updates chest numbers for candidates already registered)</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={autoGenerateIfBlank} 
              onChange={(e) => setAutoGenerateIfBlank(e.target.checked)} 
            />
            <span>🔢 <strong>Auto-generate chest number</strong> if left empty in Excel</span>
          </label>
        </div>
      </div>

      {/* Upload Box (when not displaying validation report) */}
      {!validationData && (
        <div style={{ border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', textAlign: 'center', backgroundColor: 'var(--surface-color)' }}>
          {validating || importing ? (
            <div style={{ color: 'var(--primary)', fontWeight: 600, padding: '12px' }}>
              ⌛ {validating ? "Validating candidates file for duplicates & mismatches..." : "Importing candidates..."}
            </div>
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
                <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📤</div>
                <div style={{ fontWeight: 600, color: 'var(--primary)', fontSize: '1.05rem' }}>
                  Click or Drag to Upload Candidates Excel
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '6px', maxWidth: '600px', margin: '6px auto 0' }}>
                  Supported columns: <strong>Candidate Name</strong>, <strong>Chest Number</strong>, <strong>Team</strong>, <strong>Category</strong>.
                  <br />Customized chest numbers (numeric, alphanumeric like <code>A101</code> or <code>101</code>) are preserved and auto-approved.
                </div>
              </label>
            </>
          )}
        </div>
      )}

      {/* Validation & Error Inspection Report */}
      {validationData && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: 'var(--surface-color)', marginTop: 'var(--spacing-md)' }}>
          {/* Summary Status Header */}
          <div style={{ 
            padding: 'var(--spacing-md)', 
            backgroundColor: validationData.summary.errorCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {validationData.summary.errorCount > 0 ? (
                  <span style={{ color: 'var(--error)' }}>⚠️ Validation Found {validationData.summary.errorCount} Issue(s)</span>
                ) : (
                  <span style={{ color: 'var(--success)' }}>✅ All {validationData.summary.validCount} Rows Validated Successfully!</span>
                )}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Total Rows: <strong>{validationData.summary.totalRows}</strong> | 
                Valid Candidates: <strong style={{ color: 'var(--success)' }}>{validationData.summary.validCount}</strong> | 
                Duplicates: <strong style={{ color: validationData.summary.duplicateCount > 0 ? 'var(--error)' : 'inherit' }}>{validationData.summary.duplicateCount}</strong> | 
                Mismatches: <strong style={{ color: validationData.summary.mismatchCount > 0 ? '#f59e0b' : 'inherit' }}>{validationData.summary.mismatchCount}</strong> | 
                Missing: <strong style={{ color: validationData.summary.missingCount > 0 ? 'var(--error)' : 'inherit' }}>{validationData.summary.missingCount}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setValidationData(null)} 
                className="btn btn-secondary" 
                style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                disabled={importing}
              >
                ❌ Clear / Re-upload
              </button>

              {validationData.summary.validCount > 0 && (
                <button 
                  onClick={() => handleExecuteImport(validationData.validCandidates)} 
                  className="btn btn-primary" 
                  disabled={importing}
                  style={{ 
                    fontSize: '0.85rem', 
                    padding: '6px 16px',
                    backgroundColor: 'var(--success)', 
                    color: 'white', 
                    border: 'none',
                    fontWeight: 600
                  }}
                >
                  {importing ? "Importing..." : `🚀 Import ${validationData.summary.validCount} Valid Candidates`}
                </button>
              )}
            </div>
          </div>

          {/* Categorized Filter Tabs (Only if errors exist) */}
          {validationData.summary.errorCount > 0 && (
            <div>
              <div style={{ display: 'flex', gap: '4px', padding: '8px 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(0,0,0,0.03)', overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('ALL')}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeTab === 'ALL' ? 'var(--primary)' : 'transparent',
                    color: activeTab === 'ALL' ? 'white' : 'var(--text-secondary)'
                  }}
                >
                  All Errors ({validationData.summary.errorCount})
                </button>

                {validationData.summary.duplicateCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('DUPLICATES')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: activeTab === 'DUPLICATES' ? 'var(--error)' : 'transparent',
                      color: activeTab === 'DUPLICATES' ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    🔴 Duplicate Chest Numbers ({validationData.summary.duplicateCount})
                  </button>
                )}

                {validationData.categorizedErrors.teamMismatches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('TEAM_MISMATCH')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: activeTab === 'TEAM_MISMATCH' ? '#ea580c' : 'transparent',
                      color: activeTab === 'TEAM_MISMATCH' ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    🟠 Team Mismatches ({validationData.categorizedErrors.teamMismatches.length})
                  </button>
                )}

                {validationData.categorizedErrors.categoryMismatches.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('CAT_MISMATCH')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: activeTab === 'CAT_MISMATCH' ? '#d97706' : 'transparent',
                      color: activeTab === 'CAT_MISMATCH' ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    🟡 Category Mismatches ({validationData.categorizedErrors.categoryMismatches.length})
                  </button>
                )}

                {validationData.summary.missingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('MISSING')}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: 'none',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      backgroundColor: activeTab === 'MISSING' ? 'var(--text-muted)' : 'transparent',
                      color: activeTab === 'MISSING' ? 'white' : 'var(--text-secondary)'
                    }}
                  >
                    ⚪ Missing Data ({validationData.summary.missingCount})
                  </button>
                )}
              </div>

              {/* Error Rows Table / List */}
              <div style={{ maxHeight: '320px', overflowY: 'auto', padding: 'var(--spacing-sm)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '6px 8px', width: '70px' }}>Row #</th>
                      <th style={{ padding: '6px 8px', width: '120px' }}>Issue Type</th>
                      <th style={{ padding: '6px 8px', width: '150px' }}>Candidate Name</th>
                      <th style={{ padding: '6px 8px', width: '100px' }}>Chest No</th>
                      <th style={{ padding: '6px 8px' }}>Error Details & How to Fix</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'ALL' || activeTab === 'DUPLICATES') && validationData.categorizedErrors.duplicateChestNumbers.map((err, idx) => (
                      <tr key={`dup-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(239, 68, 68, 0.04)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>Row {err.row}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {err.type === 'DUPLICATE_CHEST_NUMBER_EXCEL' ? 'File Duplicate' : 'DB Duplicate'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{err.name}</td>
                        <td style={{ padding: '6px 8px', color: 'var(--error)', fontWeight: 700 }}>{err.chestNumber || '-'}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <div>{err.message}</div>
                          {err.details && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{err.details}</div>}
                        </td>
                      </tr>
                    ))}

                    {(activeTab === 'ALL' || activeTab === 'TEAM_MISMATCH') && validationData.categorizedErrors.teamMismatches.map((err, idx) => (
                      <tr key={`team-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(234, 88, 12, 0.04)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>Row {err.row}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ backgroundColor: 'rgba(234, 88, 12, 0.15)', color: '#ea580c', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            Team Mismatch
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{err.name}</td>
                        <td style={{ padding: '6px 8px' }}>-</td>
                        <td style={{ padding: '6px 8px' }}>
                          <div>{err.message}</div>
                          {err.suggestedValues && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Available Teams: {err.suggestedValues.slice(0, 6).join(', ')}{err.suggestedValues.length > 6 ? '...' : ''}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {(activeTab === 'ALL' || activeTab === 'CAT_MISMATCH') && validationData.categorizedErrors.categoryMismatches.map((err, idx) => (
                      <tr key={`cat-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(217, 119, 6, 0.04)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>Row {err.row}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', color: '#d97706', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            Category Mismatch
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{err.name}</td>
                        <td style={{ padding: '6px 8px' }}>-</td>
                        <td style={{ padding: '6px 8px' }}>
                          <div>{err.message}</div>
                          {err.suggestedValues && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Available Categories: {err.suggestedValues.join(', ')}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {(activeTab === 'ALL' || activeTab === 'MISSING') && validationData.categorizedErrors.missingFields.map((err, idx) => (
                      <tr key={`miss-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(100, 116, 139, 0.04)' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>Row {err.row}</td>
                        <td style={{ padding: '6px 8px' }}>
                          <span style={{ backgroundColor: 'rgba(100, 116, 139, 0.15)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            Missing Data
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{err.name}</td>
                        <td style={{ padding: '6px 8px' }}>-</td>
                        <td style={{ padding: '6px 8px' }}>
                          <div>{err.message}</div>
                          {err.details && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{err.details}</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top-level Notification Alerts */}
      {error && (
        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm) var(--spacing-md)', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
          ✅ {success}
        </div>
      )}
    </div>
  );
}

