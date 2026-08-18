"use client";

import React from 'react';
import { getTeamColor } from '@/lib/teamTheme';

export interface PodiumItem {
  id: string;
  name: string;
  subName?: string;
  points: number;
  rank: 1 | 2 | 3;
  photoUrl?: string | null;
  teamName?: string | null;
  teamFlagColor?: string | null;
  tag?: string;
}

interface PodiumProps {
  items: PodiumItem[];
  variant?: 'team' | 'individual';
  className?: string;
}

export default function Podium({ items, variant = 'team', className = '' }: PodiumProps) {
  const rank1 = items.find(i => i.rank === 1);
  const rank2 = items.find(i => i.rank === 2);
  const rank3 = items.find(i => i.rank === 3);

  if (!rank1 && !rank2 && !rank3) {
    return (
      <div className="podium-empty">
        <div className="podium-empty-icon">🏆</div>
        <p>No podium standings available yet.</p>
      </div>
    );
  }

  return (
    <div className={`podium-root ${className}`}>
      <div className="podium-container">
        {/* 2nd Place - Left */}
        <div className="podium-slot slot-2">
          {rank2 ? (
            <PodiumCard item={rank2} variant={variant} />
          ) : (
            <div className="podium-slot-placeholder">--</div>
          )}
          <div className="podium-pedestal pedestal-2">
            <span className="pedestal-rank font-mono-num">2</span>
          </div>
        </div>

        {/* 1st Place - Center (Tallest, Gold Glow) */}
        <div className="podium-slot slot-1">
          {rank1 ? (
            <PodiumCard item={rank1} variant={variant} isFirst />
          ) : (
            <div className="podium-slot-placeholder">--</div>
          )}
          <div className="podium-pedestal pedestal-1">
            <div className="pedestal-crown">👑</div>
            <span className="pedestal-rank font-mono-num">1</span>
          </div>
        </div>

        {/* 3rd Place - Right */}
        <div className="podium-slot slot-3">
          {rank3 ? (
            <PodiumCard item={rank3} variant={variant} />
          ) : (
            <div className="podium-slot-placeholder">--</div>
          )}
          <div className="podium-pedestal pedestal-3">
            <span className="pedestal-rank font-mono-num">3</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .podium-root {
          width: 100%;
          padding: 1.25rem 0.25rem 0.5rem 0.25rem;
          display: flex;
          justify-content: center;
          box-sizing: border-box;
          overflow: hidden;
        }

        .podium-container {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 8px;
          align-items: flex-end;
          width: 100%;
          max-width: 640px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .podium-slot {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-width: 0;
          width: 100%;
        }

        .podium-slot-placeholder {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--muted);
          font-size: 0.9rem;
        }

        .podium-pedestal {
          width: 100%;
          border-radius: 12px 12px 4px 4px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 12px rgba(18, 22, 42, 0.08);
          border-top: 2px solid rgba(255, 255, 255, 0.5);
          box-sizing: border-box;
        }

        .pedestal-1 {
          height: 96px;
          background: linear-gradient(180deg, #ecc884 0%, #c8973f 100%);
          color: #4a3410;
          box-shadow: 0 12px 32px -8px rgba(200, 151, 63, 0.45);
        }

        .pedestal-2 {
          height: 72px;
          background: linear-gradient(180deg, #f1f3f9 0%, #d8dbe9 100%);
          color: #3b4256;
        }

        .pedestal-3 {
          height: 54px;
          background: linear-gradient(180deg, #ebd4bf 0%, #c8997a 100%);
          color: #4e2e17;
        }

        .pedestal-crown {
          position: absolute;
          top: -24px;
          font-size: 1.3rem;
          filter: drop-shadow(0 2px 6px rgba(200, 151, 63, 0.6));
          animation: floatCrown 3s ease-in-out infinite;
        }

        @keyframes floatCrown {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .pedestal-rank {
          font-size: 1.75rem;
          font-weight: 800;
          line-height: 1;
        }

        .podium-empty {
          text-align: center;
          padding: 2.5rem 1rem;
          color: var(--muted);
          background: var(--surface);
          border-radius: var(--radius);
          border: 1px dashed var(--border);
        }

        .podium-empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
          opacity: 0.7;
        }

        @media (max-width: 500px) {
          .podium-container {
            gap: 4px;
          }
          .pedestal-1 { height: 75px; }
          .pedestal-2 { height: 55px; }
          .pedestal-3 { height: 42px; }
          .pedestal-rank { font-size: 1.3rem; }
        }
      `}</style>
    </div>
  );
}

function PodiumCard({
  item,
  variant,
  isFirst = false,
}: {
  item: PodiumItem;
  variant: 'team' | 'individual';
  isFirst?: boolean;
}) {
  const teamColor = getTeamColor(item.teamName || item.name, item.teamFlagColor);

  return (
    <div className={`podium-card ${isFirst ? 'podium-card-first' : ''}`}>
      {/* Avatar / Monogram */}
      <div
        className="podium-avatar"
        style={{
          borderColor: isFirst ? 'var(--gold)' : teamColor,
          boxShadow: isFirst ? '0 0 20px rgba(200, 151, 63, 0.4)' : 'none',
        }}
      >
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} className="podium-img" />
        ) : (
          <div
            className="podium-monogram font-display"
            style={{
              background: `linear-gradient(135deg, ${teamColor}, #12162a)`,
            }}
          >
            {item.name.charAt(0)}
          </div>
        )}

        <div
          className="podium-badge font-mono-num"
          style={{
            backgroundColor: isFirst ? 'var(--gold)' : item.rank === 2 ? '#a0aec0' : '#c8997a',
            color: isFirst ? 'var(--gold-ink)' : '#ffffff',
          }}
        >
          #{item.rank}
        </div>
      </div>

      {/* Name and Meta */}
      <div className="podium-info">
        <h4 className="podium-name font-display" title={item.name}>
          {item.name}
        </h4>
        {item.subName && <div className="podium-sub">{item.subName}</div>}
        <div className="podium-points font-mono-num" style={{ color: isFirst ? 'var(--gold-ink)' : 'var(--text)' }}>
          {item.points} <span className="pts-label">pts</span>
        </div>
      </div>

      <style jsx>{`
        .podium-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 0.5rem 0.25rem 0.75rem 0.25rem;
          width: 100%;
          min-width: 0;
        }

        .podium-card-first {
          transform: translateY(-6px);
        }

        .podium-avatar {
          position: relative;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          padding: 2px;
          border: 3px solid var(--border);
          background: var(--surface);
          margin-bottom: 0.5rem;
          transition: transform 0.2s;
        }

        .podium-card-first .podium-avatar {
          width: 76px;
          height: 76px;
        }

        .podium-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }

        .podium-monogram {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          color: white;
          font-weight: 700;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
        }

        .podium-card-first .podium-monogram {
          font-size: 1.6rem;
        }

        .podium-badge {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-size: 0.7rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--surface);
          box-shadow: var(--shadow-sm);
        }

        .podium-card-first .podium-badge {
          width: 24px;
          height: 24px;
          font-size: 0.75rem;
        }

        .podium-info {
          width: 100%;
          padding: 0 2px;
        }

        .podium-name {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text);
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .podium-card-first .podium-name {
          font-size: 1.05rem;
          font-weight: 800;
        }

        .podium-sub {
          font-size: 0.72rem;
          color: var(--muted);
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .podium-points {
          margin-top: 4px;
          font-size: 0.95rem;
          font-weight: 800;
          display: inline-block;
          background: rgba(18, 22, 42, 0.05);
          padding: 2px 8px;
          border-radius: 9999px;
        }

        .podium-card-first .podium-points {
          font-size: 1.05rem;
          background: rgba(200, 151, 63, 0.15);
          color: var(--gold-ink) !important;
        }

        .pts-label {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          opacity: 0.8;
        }

        @media (max-width: 500px) {
          .podium-avatar { width: 44px; height: 44px; margin-bottom: 0.25rem; }
          .podium-card-first .podium-avatar { width: 54px; height: 54px; }
          .podium-monogram { font-size: 0.95rem; }
          .podium-card-first .podium-monogram { font-size: 1.15rem; }
          .podium-name { font-size: 0.72rem; }
          .podium-card-first .podium-name { font-size: 0.78rem; }
          .podium-points { font-size: 0.72rem; padding: 1px 4px; margin-top: 2px; }
          .podium-card-first .podium-points { font-size: 0.8rem; }
          .podium-sub { font-size: 0.6rem; }
          .pts-label { font-size: 0.55rem; }
        }
      `}</style>
    </div>
  );
}
