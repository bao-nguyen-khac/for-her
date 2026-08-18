import React, { useState } from "react";
import { formatPrice } from "../App";

// 1. Revenue Line Chart (Interactive SVG)
export const RevenueLineChart = ({ labels = [], data = [] }) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const width = 600;
  const height = 300;
  const padding = { top: 30, right: 30, bottom: 50, left: 75 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max value for scaling
  const maxVal = Math.max(...data, 1000);

  // Calculate points
  const points = data.map((val, idx) => {
    const x = padding.left + (idx / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - (val / maxVal) * chartHeight;
    return { x, y, val, label: labels[idx], index: idx };
  });

  // SVG Line path string
  let linePath = "";
  let areaPath = "";

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` +
      points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");

    areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;
  }

  // Y-axis gridlines (4 lines)
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = (maxVal * (gridCount - i)) / gridCount;
    const y = padding.top + (i / gridCount) * chartHeight;
    return { y, label: formatPrice(val), val };
  });

  // X-axis labels: show max 8 labels to prevent crowding
  const labelSkip = Math.max(1, Math.ceil(labels.length / 8));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs relative w-full h-full flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-gray-800">Biểu đồ doanh thu</h2>
        <p className="text-xs text-gray-500">Doanh số bán hàng trong khoảng thời gian đã chọn</p>
      </div>

      <div className="relative w-full overflow-x-auto my-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-auto overflow-visible">
          <defs>
            <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C586A5" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#C586A5" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={line.y}
                x2={width - padding.right}
                y2={line.y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={line.y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 font-medium"
              >
                {line.label}
              </text>
            </g>
          ))}

          {/* Area fill */}
          {areaPath && (
            <path d={areaPath} fill="url(#chart-gradient)" />
          )}

          {/* Line path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#C586A5"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* X Axis labels */}
          {points.map((p, idx) => {
            if (idx % labelSkip !== 0 && idx !== points.length - 1) return null;
            return (
              <text
                key={idx}
                x={p.x}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-[10px] fill-gray-400 font-medium"
              >
                {p.label}
              </text>
            );
          })}

          {/* Interactive hover points */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#C586A5"
                stroke="white"
                strokeWidth="2"
                className="transition-all duration-150 cursor-pointer hover:r-6"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="12"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-10 bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 shadow-md pointer-events-none transition-all duration-100 flex flex-col gap-0.5 border border-gray-700"
            style={{
              left: `${(hoveredPoint.x / width) * 100}%`,
              top: `${(hoveredPoint.y / height) * 100 - 15}%`,
              transform: "translate(-50%, -100%)",
            }}
          >
            <span className="font-semibold text-gray-300">{hoveredPoint.label}</span>
            <span className="font-bold text-sm text-pink-300">{formatPrice(hoveredPoint.val)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Order Status Doughnut Chart (Interactive SVG)
export const OrderStatusDoughnutChart = ({ distribution = {} }) => {
  const statusLabels = {
    "Order Placed": { text: "Đã đặt hàng", color: "#3b82f6" },
    "Packing": { text: "Đang đóng gói", color: "#f59e0b" },
    "Shipped": { text: "Đã gửi hàng", color: "#8b5cf6" },
    "Out for delivery": { text: "Đang giao hàng", color: "#06b6d4" },
    "Delivered": { text: "Đã giao hàng", color: "#10b981" },
  };

  const dataList = Object.entries(distribution).map(([key, count]) => ({
    key,
    count,
    label: statusLabels[key]?.text || key,
    color: statusLabels[key]?.color || "#6b7280",
  }));

  const total = dataList.reduce((sum, item) => sum + item.count, 0);

  // SVG parameters
  const size = 160;
  const r = 54;
  const strokeWidth = 14;
  const center = size / 2;
  const circ = 2 * Math.PI * r;

  let accumulatedPercent = 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs w-full h-full flex flex-col justify-between">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-800">Trạng thái đơn hàng</h2>
        <p className="text-xs text-gray-500">Cơ cấu trạng thái xử lý đơn hàng</p>
      </div>

      {/* Doughnut Chart centered */}
      <div className="flex justify-center items-center my-2">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="transparent"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {total > 0 ? (
              dataList.map((item, idx) => {
                if (item.count === 0) return null;
                const percent = item.count / total;
                const strokeLength = percent * circ;
                const dashOffset = -(accumulatedPercent * circ);
                accumulatedPercent += percent;

                return (
                  <circle
                    key={idx}
                    cx={center}
                    cy={center}
                    r={r}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${strokeLength} ${circ - strokeLength}`}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                  />
                );
              })
            ) : (
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="transparent"
                stroke="#e2e8f0"
                strokeWidth={strokeWidth}
              />
            )}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-gray-800">{total}</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Đơn hàng</span>
          </div>
        </div>
      </div>

      {/* Clean Full-width Legend */}
      <div className="flex flex-col gap-2 mt-2 w-full">
        {dataList.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.count / total) * 100) : 0;
          return (
            <div
              key={idx}
              className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-gray-50/80 transition-colors text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-gray-700 whitespace-nowrap truncate">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <span className="font-bold text-gray-800">{item.count}</span>
                <span className="text-[11px] text-gray-400 font-normal">({pct}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
