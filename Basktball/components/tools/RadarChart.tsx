"use client";

import { cn } from "@/lib/utils";

interface RadarDataPoint {
  label: string;
  value: number; // 0-100
}

interface RadarChartProps {
  data: RadarDataPoint[];
  compareData?: RadarDataPoint[];
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  className?: string;
}

export function RadarChart({
  data,
  compareData,
  size = 300,
  primaryColor = "#F47B20",
  secondaryColor = "#3B82F6",
  className,
}: RadarChartProps) {
  const center = size / 2;
  const radius = (size - 60) / 2; // Leave room for labels
  const angleStep = (2 * Math.PI) / data.length;
  const rings = 5;

  // Calculate point positions
  const getPointPosition = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2; // Start from top
    const distance = (value / 100) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Generate path for data
  const generatePath = (dataPoints: RadarDataPoint[]) => {
    return dataPoints
      .map((point, i) => {
        const pos = getPointPosition(point.value, i);
        return `${i === 0 ? "M" : "L"} ${pos.x} ${pos.y}`;
      })
      .join(" ") + " Z";
  };

  // Generate ring paths
  const generateRing = (ringIndex: number) => {
    const ringRadius = (radius * (ringIndex + 1)) / rings;
    return data
      .map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = center + ringRadius * Math.cos(angle);
        const y = center + ringRadius * Math.sin(angle);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("", className)}
    >
      {/* Background rings */}
      {Array.from({ length: rings }).map((_, i) => (
        <path
          key={`ring-${i}`}
          d={generateRing(i)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {data.map((_, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return (
          <line
            key={`axis-${i}`}
            x1={center}
            y1={center}
            x2={x}
            y2={y}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        );
      })}

      {/* Compare data (if provided) */}
      {compareData && (
        <path
          d={generatePath(compareData)}
          fill={`${secondaryColor}20`}
          stroke={secondaryColor}
          strokeWidth="2"
        />
      )}

      {/* Primary data */}
      <path
        d={generatePath(data)}
        fill={`${primaryColor}30`}
        stroke={primaryColor}
        strokeWidth="2"
      />

      {/* Data points */}
      {data.map((point, i) => {
        const pos = getPointPosition(point.value, i);
        return (
          <circle
            key={`point-${i}`}
            cx={pos.x}
            cy={pos.y}
            r="4"
            fill={primaryColor}
          />
        );
      })}

      {/* Compare data points */}
      {compareData?.map((point, i) => {
        const pos = getPointPosition(point.value, i);
        return (
          <circle
            key={`compare-point-${i}`}
            cx={pos.x}
            cy={pos.y}
            r="4"
            fill={secondaryColor}
          />
        );
      })}

      {/* Labels */}
      {data.map((point, i) => {
        const angle = angleStep * i - Math.PI / 2;
        const labelRadius = radius + 25;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return (
          <text
            key={`label-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-white/70 text-xs"
          >
            {point.label}
          </text>
        );
      })}
    </svg>
  );
}
