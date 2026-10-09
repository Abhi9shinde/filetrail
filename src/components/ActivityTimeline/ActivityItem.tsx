import type { LucideIcon } from "lucide-react";
import { formatActivityTimestamp } from "../../utils/formatActivityTimestamp";

type ActivityItemProps = {
  timestamp: string;
  icon: LucideIcon;
  file: string;
  description: string;
  onClick: () => void;
};

function ActivityItem({
  timestamp,
  icon: Icon,
  file,
  description,
  onClick,
}: ActivityItemProps) {
  return (
    <button
      type="button"
      aria-label={`${file}: ${description}`}
      className="group grid w-full cursor-pointer grid-cols-[max-content_24px_minmax(0,1fr)] gap-4 text-left focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
      onClick={onClick}
    >
      {/* Time */}
      <span className="whitespace-nowrap pt-0.5 text-right text-xs text-zinc-600">
        {formatActivityTimestamp(timestamp)}
      </span>

      {/* Timeline */}
      <span aria-hidden="true" className="relative flex justify-center">
        <span className="mt-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#151517] text-zinc-500 ring-4 ring-[#0b0b0d]">
          <Icon size={11} strokeWidth={1.8} />
        </span>

        <span className="absolute top-6 h-full w-px bg-white/[0.06] group-last:hidden" />
      </span>

      {/* Event */}
      <span className="pb-8 transition-opacity duration-200 group-hover:opacity-100">
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300 transition-colors duration-200 group-hover:text-zinc-100">
            {file}
          </span>
        </span>

        <span className="mt-1 block text-xs text-zinc-600 group-hover:text-zinc-500">
          {description}
        </span>
      </span>
    </button>
  );
}

export default ActivityItem;
