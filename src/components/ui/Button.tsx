"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-[#cfcce4] text-[#1c1b2e] hover:bg-[#dcdaec] disabled:opacity-50",
  secondary:
    "bg-surface-raised text-text border border-border hover:bg-primary-soft disabled:opacity-50",
  ghost: "bg-transparent text-text hover:bg-primary-soft disabled:opacity-50",
  danger: "bg-danger text-white hover:opacity-90 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-full",
  md: "h-10 px-4 text-sm rounded-full",
  lg: "h-12 px-5 text-base rounded-full",
  icon: "h-10 w-10 rounded-full justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 font-medium transition-colors cursor-pointer",
        "disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  );
});
