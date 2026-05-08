"use client";

import * as XLSX from 'xlsx';

export default function ExcelExport({ results }: { results: any[] }) {
  const exportToExcel = () => {
    // Format data for certificate rendering
    const data = results.map(r => ({
      Program: r.program.name,
      Category: r.program.category?.name || 'General',
      Candidate: r.candidate.name,
      ChestNumber: r.candidate.chestNumber,
      Team: r.candidate.team.name,
      TeamLeader: r.candidate.team.leaderName || '',
      Place: r.rank ? `${r.rank}${getOrdinal(r.rank)}` : '-',
      Grade: r.grade || '-',
      Points: r.points,
      Event: r.program.event.name
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");

    // Download file
    XLSX.writeFile(workbook, `ArtsFest_Results_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  return (
    <button 
      onClick={exportToExcel}
      className="btn btn-secondary"
      style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderColor: '#10B981' }}
    >
      📊 Export to Excel (Certificates)
    </button>
  );
}
