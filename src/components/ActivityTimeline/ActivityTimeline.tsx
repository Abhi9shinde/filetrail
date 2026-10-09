import {
  Download,
  Pencil,
  ArrowRight,
  FolderInput,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import ActivityItem from "./ActivityItem";
import { mockActivities } from "../../data/mockActivities";
import { mockFiles } from "../../data/mockFiles";
import type { Activity, ActivityType } from "../../types/activity";

const activityIcons: Record<ActivityType, LucideIcon> = {
  download: Download,
  modify: Pencil,
  rename: ArrowRight,
  move: FolderInput,
  delete: Trash2,
};

type ActivityTimelineProps = {
  query: string;
  activityType: ActivityType | "all";
  extension: string;
  title?: string;
  onActivitySelect?: (activity: Activity) => void;
  onClear?: () => void;
  onViewAll?: () => void;
};

const searchStopWords = new Set(["file", "files", "from", "recently"]);
const eventSearchTerms: Record<ActivityType, string[]> = {
  download: ["download", "downloaded"],
  modify: ["modify", "modified", "edit", "edited"],
  rename: ["rename", "renamed"],
  move: ["move", "moved"],
  delete: ["delete", "deleted"],
};

function ActivityTimeline({
  query,
  activityType,
  extension,
  title = "Recent Activities",
  onActivitySelect,
  onClear,
  onViewAll,
}: ActivityTimelineProps) {
  const queryTerms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term && !searchStopWords.has(term));

  const filteredActivities = mockActivities
    .filter((activity) => {
      const file = mockFiles.find((record) => record.id === activity.fileId);
      const fileExtension = file?.extension.toLowerCase() ?? "";

      if (activityType !== "all" && activity.type !== activityType) {
        return false;
      }

      if (extension !== "all" && fileExtension !== extension.toLowerCase()) {
        return false;
      }

      const searchableText = [
        activity.file,
        activity.description,
        activity.type,
        ...eventSearchTerms[activity.type],
        file?.name,
        file?.path,
        fileExtension,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return queryTerms.every((term) => searchableText.includes(term));
    })
    .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  const hasActiveFilters = Boolean(query.trim()) || activityType !== "all" || extension !== "all";
  const heading = query.trim() ? `Recent Activities for ${query.trim()}` : title;

  return (
    <section className="mt-20 max-w-2xl" aria-labelledby="activity-heading">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
            Timeline
          </p>
          <p className="mt-1 text-[10px] text-zinc-600">Demonstration data</p>

          <h2 id="activity-heading" className="mt-2 text-lg font-medium text-zinc-200">
            {heading}
          </h2>
        </div>

        {onViewAll && title !== "Activity" && (
          <button
            type="button"
            onClick={onViewAll}
            className="rounded-md text-xs text-zinc-600 transition-colors hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          >
            View all <span aria-hidden="true">→</span>
          </button>
        )}
      </div>

      <div>
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              timestamp={activity.timestamp}
              icon={activityIcons[activity.type]}
              file={activity.file}
              description={activity.description}
              onClick={() => onActivitySelect?.(activity)}
            />
          ))
        ) : (
          <div className="border-t border-white/[0.06] py-10 text-center" role="status">
            <p className="text-sm text-zinc-400">
              {hasActiveFilters ? "No activity matches these search criteria" : "No activity to show"}
            </p>

            <p className="mt-1 text-xs text-zinc-600">
              Try a different name, description, event type, or extension.
            </p>

            {hasActiveFilters && onClear && (
              <button
                type="button"
                onClick={onClear}
                className="mt-4 rounded-md px-2 py-1 text-xs text-zinc-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Clear search and filters
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default ActivityTimeline;
