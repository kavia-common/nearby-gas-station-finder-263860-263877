import React, { useMemo, useState } from 'react';
import { formatDistance } from '../utils/distance';

/**
 * PUBLIC_INTERFACE
 * StationList
 * Lists gas stations with pagination and selection.
 *
 * Props:
 * - stations: array of station objects
 * - onSelect: function(station)
 * - selectedId: string | undefined
 * - loading: boolean
 * - error: string
 */
function StationList({ stations = [], onSelect, selectedId, loading = false, error = '' }) {
  const pageSize = 10;
  const [page, setPage] = useState(1);

  const pages = Math.max(1, Math.ceil(stations.length / pageSize));
  const view = useMemo(() => {
    const start = (page - 1) * pageSize;
    return stations.slice(start, start + pageSize);
  }, [stations, page]);

  const handleNext = () => setPage(p => Math.min(p + 1, pages));
  const handlePrev = () => setPage(p => Math.max(p - 1, 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <strong>Nearby Gas Stations</strong>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          {loading ? 'Loading…' : `${stations.length} result${stations.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      <div style={{ overflowY: 'auto', padding: 8, flex: 1 }}>
        {view.map((s) => {
          const rating = s.rating;
          const distanceText = s.distanceText || (s.distanceMeters != null ? formatDistance(s.distanceMeters) : undefined);
          const selected = selectedId && s.place_id === selectedId;
          return (
            <article
              key={s.place_id || s.name}
              className="station-card"
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: 10,
                padding: 10,
                background: selected ? 'rgba(59,130,246,0.06)' : '#fff',
                margin: 6
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{s.name || 'Gas station'}</div>
                  {s.vicinity && <div style={{ fontSize: 12, color: '#6b7280' }}>{s.vicinity}</div>}
                </div>
                {rating != null && (
                  <div aria-label={`Rating ${rating} out of 5`} title="Google rating" style={{ fontSize: 12 }}>
                    ⭐ {rating.toFixed(1)}
                  </div>
                )}
              </header>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div style={{ color: '#374151', fontSize: 13 }}>
                  {distanceText ? `Distance: ${distanceText}` : 'Distance unavailable'}
                </div>
                <div>
                  <button
                    className="btn"
                    onClick={() => onSelect && onSelect(s)}
                    aria-label={`Focus map on ${s.name || 'gas station'}`}
                  >
                    View
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {!loading && stations.length === 0 && (
          <div style={{ padding: 12, color: '#6b7280' }}>
            No stations found for this area. Try zooming out or panning the map.
          </div>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #e5e7eb', background: '#fff' }}>
          <button className="btn" onClick={handlePrev} disabled={page === 1} aria-label="Previous page">Prev</button>
          <div style={{ alignSelf: 'center', fontSize: 12, color: '#6b7280' }}>
            Page {page} of {pages}
          </div>
          <button className="btn" onClick={handleNext} disabled={page === pages} aria-label="Next page">Next</button>
        </nav>
      )}
    </div>
  );
}

export default StationList;
