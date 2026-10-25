import { useMemo, useState } from 'react';
import { categoryMeta, type TerritoryRegion } from '../../../data/territories.js';
import { DISPLAY_H } from './constants.js';
import type { NameStatus } from './types.js';

interface TerritorySidebarProps {
  regions: TerritoryRegion[];
  selectedSet: Set<number>;
  nameStatus: (r: TerritoryRegion) => NameStatus;
  onSelectCell: (id: number, additive: boolean) => void;
  onScrollToCell: (r: TerritoryRegion) => void;
}

export function TerritorySidebar({
  regions,
  selectedSet,
  nameStatus,
  onSelectCell,
  onScrollToCell,
}: TerritorySidebarProps) {
  const [filter, setFilter] = useState('');

  const filteredRegions = useMemo(() => {
    return regions
      .filter((r) => {
        const f = filter.trim().toLowerCase();
        if (!f) return true;
        if (['merged', 'merge', 'empty', 'mismatch', 'ok'].includes(f)) {
          return nameStatus(r).kind === (f === 'merge' ? 'merged' : f);
        }
        return (
          String(r.id) === f ||
          String(r.id).startsWith(f) ||
          (r.name ?? '').toLowerCase().includes(f) ||
          (f === 'unset' && !r.category)
        );
      })
      .sort((a, b) => a.id - b.id);
  }, [regions, filter, nameStatus]);

  return (
    <div
      style={{
        flex: '0 0 190px',
        height: DISPLAY_H,
        display: 'flex',
        flexDirection: 'column',
        background: '#15171c',
        border: '1px solid #2a2d34',
        borderRadius: 4,
      }}
    >
      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="filter id / name…"
        style={{
          margin: 6,
          padding: '4px 8px',
          background: '#0e0f13',
          color: '#e8e8ea',
          border: '1px solid #3a3d44',
          borderRadius: 4,
          fontSize: 12,
        }}
      />
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {filteredRegions.map((r) => {
          const sel = selectedSet.has(r.id);
          const m = categoryMeta(r.category);
          const st = nameStatus(r);
          const badge =
            st.kind === 'merged'
              ? { t: `⚠${st.areas.length}`, c: '#ffb454' }
              : st.kind === 'empty'
                ? { t: '∅', c: '#9aa0a8' }
                : st.kind === 'mismatch'
                  ? { t: '✗', c: '#ff6b6b' }
                  : null;

          return (
            <div
              key={r.id}
              onClick={(e) => {
                onSelectCell(r.id, e.shiftKey);
                onScrollToCell(r);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                cursor: 'pointer',
                background: sel ? '#2a2030' : 'transparent',
                borderLeft: `3px solid ${r.category ? m.fill : 'transparent'}`,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: sel ? '#ffd54a' : '#cfcfd4',
                  fontWeight: sel ? 700 : 400,
                  minWidth: 30,
                }}
              >
                #{r.id}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: '#9aa0a8',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {r.name ?? (r.category ? m.label : '')}
              </span>
              {badge && (
                <span
                  title={st.kind === 'merged' ? st.areas.map((a) => a.id).join(', ') : st.kind}
                  style={{ fontSize: 10, color: badge.c, flexShrink: 0 }}
                >
                  {badge.t}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
