"use client";

import { cn } from "@/lib/utils";
import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-bold uppercase tracking-wider transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: cn(
        "bg-[var(--orange)] text-white",
        "shadow-[0_0_20px_rgba(244,123,32,0.3)]",
        "hover:translate-y-[-3px] hover:shadow-[0_5px_30px_rgba(244,123,32,0.6)]",
        "before:absolute before:top-0 before:left-[-100%] before:w-full before:h-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent",
        "before:transition-[left] before:duration-500 hover:before:left-full"
      ),
      secondary: cn(
        "bg-transparent text-white border-3 border-[var(--orange)]",
        "hover:bg-[var(--orange)] hover:translate-y-[-3px]",
        "hover:shadow-[0_5px_30px_rgba(244,123,32,0.6)]"
      ),
      outline: cn(
        "bg-transparent text-white border-2 border-white/30",
        "hover:border-[var(--orange)] hover:text-[var(--orange)]"
      ),
      ghost: cn(
        "bg-transparent text-white",
        "hover:bg-white/10 hover:text-[var(--orange)]"
      ),
      danger: cn(
        "bg-[var(--error)] text-white",
        "hover:bg-red-600 hover:translate-y-[-3px]",
        "hover:shadow-[0_5px_30px_rgba(239,68,68,0.6)]"
      ),
    };

    const sizes = {
      sm: "px-4 py-2 text-sm",
      md: "px-8 py-3 text-base",
      lg: "px-12 py-4 text-lg",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
