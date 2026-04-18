import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "border-vitals-crimson/20 bg-vitals-crimson/10 text-vitals-crimson",
        success: "border-emerald-300 bg-emerald-50 text-emerald-700",
        warning: "border-amber-300 bg-amber-50 text-amber-700",
        info: "border-cyan-300 bg-cyan-50 text-cyan-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
