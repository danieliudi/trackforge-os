"use client";

import clsx from "clsx";
import { Loader2, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { focusRing } from "@/lib/ui";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-acc font-semibold text-acc-ink hover:bg-acc-soft disabled:hover:bg-acc",
  secondary:
    "border border-line bg-surface text-ink2 hover:border-line3 hover:text-ink disabled:hover:border-line",
  ghost:
    "text-mut hover:bg-surface2 hover:text-ink disabled:hover:bg-transparent disabled:hover:text-mut",
  danger:
    "text-mut hover:bg-danger-bg hover:text-danger disabled:hover:bg-transparent disabled:hover:text-mut",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 rounded-md px-2.5 text-xs",
  md: "h-9 gap-2 rounded-md px-3.5 text-sm",
  lg: "h-11 gap-2 rounded-lg px-5 text-sm",
};

const base = `inline-flex shrink-0 items-center justify-center font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  /** Troca o ícone por um spinner e desabilita, sem mudar a largura do botão. */
  loading?: boolean;
  icon?: LucideIcon;
  children?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon: Icon,
  children,
  className,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const iconSize = size === "lg" ? 17 : 15;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(base, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {loading ? (
        <Loader2 size={iconSize} className="animate-spin" />
      ) : Icon ? (
        <Icon size={iconSize} />
      ) : null}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ButtonProps, "children" | "icon" | "size"> & {
  icon: LucideIcon;
  /** Vira o title e o aria-label: ação só com ícone precisa de nome acessível. */
  label: string;
  size?: "sm" | "md";
};

export function IconButton({
  icon: Icon,
  label,
  variant = "ghost",
  size = "md",
  loading = false,
  className,
  disabled,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled || loading}
      className={clsx(
        base,
        VARIANTS[variant],
        size === "sm" ? "h-7 w-7 rounded-md" : "h-9 w-9 rounded-md",
        className,
      )}
      {...rest}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Icon size={size === "sm" ? 14 : 16} />
      )}
    </button>
  );
}
