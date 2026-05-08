"use client";

import { useState } from "react";
import { exportAllData, resetSystem, importData } from "./actions";

export default function MaintenanceActions() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleExport = async () => {
    setLoading(true);
    setStatus("Generating backup...");
    const result = await exportAllData();
    if (result.success) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ArtsFest_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus("✅ Backup downloaded successfully!");
    } else {
      setStatus("❌ " + result.error);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    const confirmed = confirm("⚠️ DANGER: This will delete ALL events, teams, programs, candidates, and results. This CANNOT be undone unless you have a backup. Are you sure you want to start a New Fest?");
    if (!confirmed) return;

    const secondConfirm = confirm("FINAL WARNING: Are you REALLY sure? All your data will be permanently wiped.");
    if (!secondConfirm) return;

    setLoading(true);
    setStatus("Cleaning system...");
    const result = await resetSystem();
    if (result.success) {
      setStatus("✅ System cleaned! You can now start your New Fest.");
    } else {
      setStatus("❌ " + result.error);
    }
    setLoading(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const confirmed = confirm("⚠️ This will overwrite all CURRENT data with the data from the backup file. Proceed?");
    if (!confirmed) return;

    setLoading(true);
    setStatus("Restoring data from file...");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const json = JSON.parse(evt.target?.result as string);
        const result = await importData(json);
        if (result.success) {
          setStatus("✅ Data restored successfully!");
        } else {
          setStatus("❌ " + result.error);
        }
      } catch (err) {
        setStatus("❌ Invalid backup file format.");
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ marginTop: 'var(--spacing-lg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-md)' }}>
        
        {/* Backup */}
        <div style={{ padding: 'var(--spacing-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📥 Backup All Data
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Save the current festival's data to a file. You can import this later to view old results.
          </p>
          <button onClick={handleExport} className="btn btn-secondary" style={{ width: '100%' }} disabled={loading}>
            Download Full Backup (.json)
          </button>
        </div>

        {/* Reset */}
        <div style={{ padding: 'var(--spacing-md)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧹 Clean System (New Fest)
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Delete all current data to start a new festival. Make sure you have a backup first!
          </p>
          <button onClick={handleReset} className="btn btn-secondary" style={{ width: '100%', color: 'var(--error)', borderColor: 'rgba(239, 68, 68, 0.5)' }} disabled={loading}>
            Wipe All Data & Start Fresh
          </button>
        </div>

        {/* Restore */}
        <div style={{ padding: 'var(--spacing-md)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📤 Restore Backup
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Load data from a previously saved backup file. This will replace all current data.
          </p>
          <input type="file" id="restore-file" hidden accept=".json" onChange={handleImport} />
          <label htmlFor="restore-file" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', cursor: 'pointer', padding: '0.75rem' }}>
            {loading ? "Processing..." : "Select Backup File"}
          </label>
        </div>

      </div>

      {status && (
        <div style={{ marginTop: 'var(--spacing-md)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.05)', fontWeight: 600 }}>
          {status}
        </div>
      )}
    </div>
  );
}
