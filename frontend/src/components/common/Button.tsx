"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: "btn btn-primary",
  secondary: "btn btn-secondary",
  danger: "btn btn-danger",
  ghost: "btn btn-ghost",
};

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`${VARIANT_CLASSES[variant]} ${className || ""}`.trim()}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? "Please wait…" : children}
    </button>
  );
}
