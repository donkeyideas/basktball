"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type HTMLAttributes } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "live" | "success" | "warning" | "feature";
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wider";

    const variants = {
      default: "bg-[var(--gray)] text-white",
      live: cn(
        "bg-[var(--error)] text-white",
        "before:content-[''] before:w-2 before:h-2 before:rounded-full",
        "before:bg-white before:mr-2 before:animate-pulse-live"
      ),
      success: "bg-[var(--success)] text-white",
      warning: "bg-[var(--warning)] text-black",
      feature: cn(
        "bg-[rgba(244,123,32,0.2)] text-[var(--orange)]",
        "border border-[var(--orange)]"
      ),
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
