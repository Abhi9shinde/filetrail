import type { LucideIcon } from "lucide-react";

type ActivityItemProps = {
  time: string;
  icon: LucideIcon;
  file: string;
  description: string;
  onClick: () => void;
};

function ActivityItem({
  time,
  icon: Icon,
  file,
  description,
  onClick,
}: ActivityItemProps) {
  return (
    <div
      className="group grid grid-cols-[70px_24px_1fr] gap-4"
      onClick={onClick}
    >
      {/* Time */}
      <span className="pt-0.5 text-right text-xs text-zinc-600">{time}</span>

      {/* Timeline */}
      <div className="relative flex justify-center">
        <div className="mt-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#151517] text-zinc-500 ring-4 ring-[#0b0b0d]">
          <Icon size={11} strokeWidth={1.8} />
        </div>

        <div className="absolute top-6 h-full w-px bg-white/[0.06] group-last:hidden" />
      </div>

      {/* Event */}
      <div className="pb-8 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300 transition-colors duration-200 group-hover:text-zinc-100">
            {file}
          </span>
        </div>

        <p className="mt-1 text-xs text-zinc-600 group-hover:text-zinc-500">
          {description}
        </p>
      </div>
    </div>
  );
}

export default ActivityItem;
