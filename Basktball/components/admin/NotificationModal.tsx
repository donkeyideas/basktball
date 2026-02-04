"use client";

import { useEffect, useCallback } from "react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export function NotificationModal({
  isOpen,
  onClose,
  title,
  message,
  type,
}: NotificationModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return {
          color: "var(--green)",
          icon: (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ),
        };
      case "error":
        return {
          color: "var(--red)",
          icon: (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          ),
        };
      case "warning":
        return {
          color: "var(--yellow)",
          icon: (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ),
        };
      default:
        return {
          color: "var(--blue)",
          icon: (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          ),
        };
    }
  };

  const { color, icon } = getIconAndColor();

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.2s ease-out",
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "var(--dark-gray)",
          border: `2px solid ${color}`,
          padding: "32px",
          maxWidth: "480px",
          width: "90%",
          clipPath:
            "polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)",
          animation: "slideInUp 0.3s ease-out",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <div style={{ color, marginBottom: "16px" }}>{icon}</div>
          <h2
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "24px",
              color: "var(--white)",
              marginBottom: "12px",
              textTransform: "uppercase",
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-barlow), sans-serif",
              fontSize: "16px",
              color: "rgba(255, 255, 255, 0.8)",
              lineHeight: "1.6",
              marginBottom: "24px",
              whiteSpace: "pre-wrap",
            }}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: "12px 32px",
              backgroundColor: color,
              border: "none",
              color: "var(--white)",
              fontFamily: "var(--font-barlow), sans-serif",
              fontWeight: 600,
              fontSize: "14px",
              textTransform: "uppercase",
              cursor: "pointer",
              clipPath:
                "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)",
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
