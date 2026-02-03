"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Shot {
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  made: boolean;
  value: 2 | 3;
  player?: string;
}

interface BasketballCourtProps {
  shots?: Shot[];
  showHeatmap?: boolean;
  width?: number;
  height?: number;
  className?: string;
  onCourtClick?: (x: number, y: number) => void;
}

export function BasketballCourt({
  shots = [],
  showHeatmap = false,
  width = 500,
  height = 470,
  className,
  onCourtClick,
}: BasketballCourtProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw court
    drawCourt(ctx, width, height);

    // Draw heatmap or individual shots
    if (showHeatmap && shots.length > 0) {
      drawHeatmap(ctx, shots, width, height);
    } else {
      drawShots(ctx, shots, width, height);
    }
  }, [shots, showHeatmap, width, height]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onCourtClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onCourtClick(x, y);
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("bg-[#1a1a2e] rounded", className)}
      onClick={handleClick}
      style={{ cursor: onCourtClick ? "crosshair" : "default" }}
    />
  );
}

// Draw the basketball court
function drawCourt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const courtColor = "#2a2a3e";
  const lineColor = "#F47B20";
  const lineWidth = 2;

  // Scale factors
  const scaleX = w / 500;
  const scaleY = h / 470;

  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = courtColor;

  // Court background
  ctx.fillRect(0, 0, w, h);

  // Outer boundary
  ctx.strokeRect(10 * scaleX, 10 * scaleY, 480 * scaleX, 450 * scaleY);

  // Paint area (key)
  ctx.strokeRect(170 * scaleX, 10 * scaleY, 160 * scaleX, 190 * scaleY);

  // Free throw circle
  ctx.beginPath();
  ctx.arc(250 * scaleX, 200 * scaleY, 60 * scaleX, 0, Math.PI, false);
  ctx.stroke();

  // Free throw circle (dashed bottom)
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(250 * scaleX, 200 * scaleY, 60 * scaleX, Math.PI, 2 * Math.PI, false);
  ctx.stroke();
  ctx.setLineDash([]);

  // Restricted area (semi-circle)
  ctx.beginPath();
  ctx.arc(250 * scaleX, 52 * scaleY, 40 * scaleX, 0, Math.PI, false);
  ctx.stroke();

  // Backboard
  ctx.beginPath();
  ctx.moveTo(220 * scaleX, 40 * scaleY);
  ctx.lineTo(280 * scaleX, 40 * scaleY);
  ctx.stroke();

  // Rim
  ctx.beginPath();
  ctx.arc(250 * scaleX, 52 * scaleY, 8 * scaleX, 0, 2 * Math.PI);
  ctx.stroke();

  // Three-point line
  // Calculate arc parameters to connect properly with corner lines
  const arcCenterX = 250 * scaleX;
  const arcCenterY = 52 * scaleY;
  const arcRadius = 238 * scaleX;
  const cornerY = 140 * scaleY;

  // Calculate angles where arc meets corner lines
  const leftCornerX = 30 * scaleX;
  const rightCornerX = 470 * scaleX;
  const leftAngle = Math.atan2(cornerY - arcCenterY, leftCornerX - arcCenterX);
  const rightAngle = Math.atan2(cornerY - arcCenterY, rightCornerX - arcCenterX);

  ctx.beginPath();
  // Left corner (from baseline to where arc starts)
  ctx.moveTo(30 * scaleX, 10 * scaleY);
  ctx.lineTo(30 * scaleX, cornerY);
  // Arc (from left to right, going clockwise around the basket)
  ctx.arc(arcCenterX, arcCenterY, arcRadius, leftAngle, rightAngle, false);
  // Right corner (from where arc ends to baseline)
  ctx.lineTo(470 * scaleX, 10 * scaleY);
  ctx.stroke();

  // Center court line (half court)
  ctx.beginPath();
  ctx.moveTo(10 * scaleX, 460 * scaleY);
  ctx.lineTo(490 * scaleX, 460 * scaleY);
  ctx.stroke();

  // Center circle
  ctx.beginPath();
  ctx.arc(250 * scaleX, 460 * scaleY, 60 * scaleX, Math.PI, 2 * Math.PI, false);
  ctx.stroke();
}

// Draw individual shots
function drawShots(
  ctx: CanvasRenderingContext2D,
  shots: Shot[],
  w: number,
  h: number
) {
  shots.forEach((shot) => {
    const x = (shot.x / 100) * w;
    const y = (shot.y / 100) * h;
    const radius = 6;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);

    if (shot.made) {
      ctx.fillStyle = shot.value === 3 ? "#22C55E" : "#3B82F6";
      ctx.fill();
    } else {
      ctx.strokeStyle = shot.value === 3 ? "#EF4444" : "#F59E0B";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
}

// Draw heatmap
function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  shots: Shot[],
  w: number,
  h: number
) {
  // Create grid
  const gridSize = 20;
  const cols = Math.ceil(w / gridSize);
  const rows = Math.ceil(h / gridSize);
  const grid: { made: number; total: number }[][] = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({ made: 0, total: 0 }))
    );

  // Populate grid
  shots.forEach((shot) => {
    const x = Math.floor((shot.x / 100) * w / gridSize);
    const y = Math.floor((shot.y / 100) * h / gridSize);
    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      grid[y][x].total++;
      if (shot.made) grid[y][x].made++;
    }
  });

  // Draw heatmap
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const cell = grid[row][col];
      if (cell.total === 0) continue;

      const percentage = cell.made / cell.total;
      const intensity = Math.min(cell.total / 5, 1); // Max intensity at 5 shots

      // Color based on efficiency
      let r, g, b;
      if (percentage >= 0.5) {
        // Green for good efficiency
        r = Math.round(50 + (1 - percentage) * 150);
        g = Math.round(150 + percentage * 100);
        b = 50;
      } else {
        // Red for poor efficiency
        r = Math.round(200 + (0.5 - percentage) * 100);
        g = Math.round(100 * percentage * 2);
        b = 50;
      }

      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity * 0.7})`;
      ctx.fillRect(col * gridSize, row * gridSize, gridSize, gridSize);
    }
  }
}

export type { Shot };
