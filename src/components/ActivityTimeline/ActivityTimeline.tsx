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
import type { ActivityType } from "../../types/activity";
import type { Activity } from "../../types/activity";

const activityIcons: Record<ActivityType, LucideIcon> = {
  download: Download,
  modify: Pencil,
  rename: ArrowRight,
  move: FolderInput,
  delete: Trash2,
};

type ActivityTimelineProps = {
  query: string;
  onActivitySelect?: (activity: Activity) => void;
};

function ActivityTimeline({ query, onActivitySelect }: ActivityTimelineProps) {
  const filteredActivities = mockActivities.filter((activity) => {
    if (!query.trim()) {
      return true;
    }

    const searchText = `${activity.file} ${activity.description}`.toLowerCase();

    return searchText.includes(query.toLowerCase().trim());
  });

  return (
    <section className="mt-20 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-600">
            Timeline
          </p>

          {filteredActivities.length > 0 && query ? (
            <h2 className="mt-2 text-lg font-medium text-zinc-200">
              Recent Activities for {query}
            </h2>
          ) : (
            <h2 className="mt-2 text-lg font-medium text-zinc-200">
              Recent Activities
            </h2>
          )}
        </div>

        <button className="text-xs text-zinc-600 transition-colors hover:text-zinc-300">
          View all →
        </button>
      </div>

      <div>
        {filteredActivities.length > 0 ? (
          filteredActivities.map((activity) => (
            <ActivityItem
              key={activity.id}
              time={activity.time}
              icon={activityIcons[activity.type]}
              file={activity.file}
              description={activity.description}
              onClick={() => onActivitySelect && onActivitySelect(activity)}
            />
          ))
        ) : (
          <div className="border-t border-white/[0.06] py-10 text-center">
            <p className="text-sm text-zinc-400">No activity found</p>

            <p className="mt-1 text-xs text-zinc-600">
              Try a different file name or activity.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ActivityTimeline;
