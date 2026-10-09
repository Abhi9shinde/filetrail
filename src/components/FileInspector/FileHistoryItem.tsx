import { ChevronRight } from "lucide-react";
import { useState } from "react";

import type { Activity } from "../../types/activity";
import { formatActivityTimestamp } from "../../utils/formatActivityTimestamp";

type FileHistoryItemProps = {
  activity: Activity;
};

function FileHistoryItem({ activity }: FileHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const canExpand = Boolean(activity.details);

  return (
    <div className="border-b border-white/[0.06] py-4">
      <button
        type="button"
        onClick={() => canExpand && setExpanded(!expanded)}
        disabled={!canExpand}
        aria-expanded={canExpand ? expanded : undefined}
        className={`flex w-full items-start gap-3 text-left focus-visible:rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 ${
          canExpand ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span className="w-max min-w-24 shrink-0 whitespace-nowrap pt-0.5 text-xs text-zinc-600">
          {formatActivityTimestamp(activity.timestamp)}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-zinc-300">
            {activity.type === "modify"
              ? "Edited"
              : activity.type === "rename"
                ? "Renamed"
                : activity.type === "move"
                  ? "Moved"
                  : activity.type === "download"
                    ? "Downloaded"
                    : "Deleted"}
          </span>

          <span className="mt-1 block text-xs text-zinc-600">{activity.description}</span>
        </span>

        {canExpand && (
          <ChevronRight
            size={14}
            className={`mt-1 shrink-0 text-zinc-600 transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      {expanded && activity.details && (
        <div className="ml-27 mt-3 border-l border-white/[0.06] pl-3">
          <p className="text-xs leading-5 text-zinc-600">{activity.details}</p>
        </div>
      )}
    </div>
  );
}

export default FileHistoryItem;
