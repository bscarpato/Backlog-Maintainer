import { avatarBg, nameInitials } from "../lib/ui";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
  showName?: boolean;
  className?: string;
}

const SIZE: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm"
};

export function Avatar({ name, size = "md", showName = false, className = "" }: AvatarProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${avatarBg(name)} ${SIZE[size]}`}
        title={name}
      >
        {nameInitials(name)}
      </span>
      {showName && <span className="text-sm font-medium text-slate-700">{name}</span>}
    </span>
  );
}
