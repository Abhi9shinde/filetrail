import { ChevronRight } from "lucide-react";
import { useState } from "react";

import type { Activity } from "../../types/activity";

type FileHistoryItemProps = {
  activity: Activity;
};

function FileHistoryItem({ activity }: FileHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const canExpand = activity.type === "modify";

  return (
    <div className="border-b border-white/[0.06] py-4">
      <button
        type="button"
        onClick={() => canExpand && setExpanded(!expanded)}
        className={`flex w-full items-start gap-3 text-left ${
          canExpand ? "cursor-pointer" : "cursor-default"
        }`}
      >
        <span className="w-24 shrink-0 pt-0.5 text-xs text-zinc-600">
          {activity.time}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-300">
            {activity.type === "modify"
              ? "Edited"
              : activity.type === "rename"
                ? "Renamed"
                : activity.type === "move"
                  ? "Moved"
                  : activity.type === "download"
                    ? "Downloaded"
                    : "Deleted"}
          </p>

          <p className="mt-1 text-xs text-zinc-600">{activity.description}</p>
        </div>

        {canExpand && (
          <ChevronRight
            size={14}
            className={`mt-1 shrink-0 text-zinc-600 transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
      </button>

      {expanded && (
        <div className="ml-27 mt-3 border-l border-white/[0.06] pl-3">
          <p className="text-xs leading-5 text-zinc-600">
            37 file changes were detected during this edit session.
          </p>
        </div>
      )}
    </div>
  );
}

export default FileHistoryItem;
