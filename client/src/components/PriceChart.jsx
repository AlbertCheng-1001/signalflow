import { useMemo, useState } from "react";
import { StatusBadge, CATEGORY_STATUS } from "./StatusBadge";

const WIDTH = 760;
const HEIGHT = 280;
const PADDING = { top: 16, right: 16, bottom: 28, left: 56 };
const PLOT_W = WIDTH - PADDING.left - PADDING.right;
const PLOT_H = HEIGHT - PADDING.top - PADDING.bottom;

const ET_TZ = "America/New_York";

function closestCandleIndexForTimestamp(candles, targetMs) {
  let bestIdx = 0;
  let bestDiff = Infinity;
  for (let i = 0; i < candles.length; i++) {
    const diff = Math.abs(new Date(candles[i].t).getTime() - targetMs);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// Tick labels: intraday ranges show time-of-day (multi-day ones also show the date),
// 1mo shows just the date.
function formatTick(isoString, range) {
  const d = new Date(isoString);
  if (range === "1mo") {
    return d.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", timeZone: ET_TZ });
  }
  if (range === "1d") {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: ET_TZ });
  }
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: ET_TZ });
}

function formatTooltipDate(isoString) {
  return new Date(isoString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: ET_TZ,
  });
}

export function PriceChart({ ticker, candles, events, range }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  const { xScale, yScale, minClose, maxClose } = useMemo(() => {
    const closes = candles.map((c) => c.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const pad = (max - min) * 0.08 || 1;
    const lo = min - pad;
    const hi = max + pad;
    const n = candles.length;
    return {
      minClose: lo,
      maxClose: hi,
      xScale: (i) => PADDING.left + (n <= 1 ? 0 : (i / (n - 1)) * PLOT_W),
      yScale: (v) => PADDING.top + (1 - (v - lo) / (hi - lo)) * PLOT_H,
    };
  }, [candles]);

  const linePath = useMemo(
    () => candles.map((c, i) => `${i === 0 ? "M" : "L"}${xScale(i)},${yScale(c.close)}`).join(" "),
    [candles, xScale, yScale]
  );

  const markers = useMemo(() => {
    if (candles.length === 0) return [];
    return events.map((e) => {
      const idx = closestCandleIndexForTimestamp(candles, new Date(e.occurred_at).getTime());
      const candle = candles[idx];
      return { event: e, x: xScale(idx), y: yScale(candle.close), candleIndex: idx };
    });
  }, [events, candles, xScale, yScale]);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const n = candles.length;
    const frac = Math.max(0, Math.min(1, (relX - PADDING.left) / PLOT_W));
    const idx = Math.max(0, Math.min(n - 1, Math.round(frac * (n - 1))));
    setHoverIndex(idx);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: rect.width });
  }

  if (candles.length === 0) {
    return <p className="page-note">No price history available for {ticker}.</p>;
  }

  const yTicks = [0, 0.33, 0.66, 1].map((f) => minClose + f * (maxClose - minClose));
  const xTickIndices = [0, Math.floor((candles.length - 1) / 2), candles.length - 1];
  const hovered = hoverIndex != null ? candles[hoverIndex] : null;
  const hoveredMarkers = hoverIndex != null ? markers.filter((m) => m.candleIndex === hoverIndex) : [];

  return (
    <div className="chart-wrap">
      <div className="chart-container" onMouseMove={handleMouseMove} onMouseLeave={() => setHoverIndex(null)}>
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="price-chart" preserveAspectRatio="none">
          {yTicks.map((v, i) => {
            const y = yScale(v);
            return (
              <g key={i}>
                <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y} y2={y} className="chart-gridline" />
                <text x={PADDING.left - 8} y={y} className="chart-axis-label" textAnchor="end" dominantBaseline="middle">
                  ${v.toFixed(0)}
                </text>
              </g>
            );
          })}

          {xTickIndices.map((i) => (
            <text key={i} x={xScale(i)} y={HEIGHT - 6} className="chart-axis-label" textAnchor="middle">
              {formatTick(candles[i].t, range)}
            </text>
          ))}

          <path d={linePath} className="chart-line" />

          {hoverIndex != null && (
            <>
              <line
                x1={xScale(hoverIndex)}
                x2={xScale(hoverIndex)}
                y1={PADDING.top}
                y2={HEIGHT - PADDING.bottom}
                className="chart-crosshair"
              />
              <circle cx={xScale(hoverIndex)} cy={yScale(hovered.close)} r={4} className="chart-hover-dot" />
            </>
          )}

          {markers.map((m, i) => (
            <circle
              key={i}
              cx={m.x}
              cy={m.y}
              r={5}
              className={`chart-marker chart-marker-${CATEGORY_STATUS[m.event.category]}`}
            />
          ))}
        </svg>

        {hovered && mousePos && (
          <div
            className="chart-tooltip"
            style={{ left: Math.min(mousePos.x + 12, mousePos.width - 220), top: Math.max(mousePos.y - 12, 0) }}
          >
            <div className="chart-tooltip-date">{formatTooltipDate(hovered.t)}</div>
            <div className="chart-tooltip-price">${hovered.close.toFixed(2)}</div>
            {hoveredMarkers.map((m, i) => (
              <div key={i} className="chart-tooltip-event">
                <StatusBadge value={m.event.category} status={CATEGORY_STATUS[m.event.category]} />
                <span className="chart-tooltip-rationale">{m.event.rationale}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="chart-legend">
        <span className="badge badge-good"><span className="badge-dot" aria-hidden="true" />Ignore</span>
        <span className="badge badge-warning"><span className="badge-dot" aria-hidden="true" />Alert</span>
        <span className="badge badge-critical"><span className="badge-dot" aria-hidden="true" />Escalate</span>
      </div>
    </div>
  );
}
