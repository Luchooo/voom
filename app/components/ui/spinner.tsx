"use client";

import * as React from "react";

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  /** Tamaño: sm (16px), default (20px), lg (24px) */
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "h-4 w-4",
  default: "h-5 w-5",
  lg: "h-6 w-6",
};

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ size = "default", className = "", ...props }, ref) => (
    <svg
      ref={ref}
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Cargando"
      {...props}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="32 56"
      />
    </svg>
  )
);
Spinner.displayName = "Spinner";
