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

const searchStopWords = new Set(["file", "files", "from"]);
const eventSearchTerms: Record<ActivityType, string[]> = {
  download: ["download", "downloaded"],
  modify: ["modify", "modified", "edit", "edited"],
  rename: ["rename", "renamed"],
  move: ["move", "moved"],
  delete: ["delete", "deleted"],
};

function getSearchIntent(query: string): { type: ActivityType | null; text: string } {
  const intent = query.match(/\brecently\s+(renamed|modified)\b/i);
  if (!intent) return { type: null, text: query };

  const type: ActivityType = intent[1].toLowerCase() === "renamed" ? "rename" : "modify";
  return { type, text: query.replace(intent[0], " ").trim() };
}

function previousFilename(activity: Activity): string | null {
  if (activity.type !== "rename") return null;
  return activity.description.match(/\brenamed from\s+(.+)$/i)?.[1]?.trim() ?? null;
}

function getFilenameCandidates(activity: Activity, currentName?: string): string[] {
  const activityFilename = /[\\/]\s*$/.test(activity.file)
    ? undefined
    : activity.file.split(/[\\/]/).filter(Boolean).at(-1);
  return [activityFilename, currentName, previousFilename(activity)]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());
}

function getRelevanceRank(
  query: string,
  terms: string[],
  filenames: string[],
  paths: string[],
  descriptions: string[],
): number {
  if (!query) return 0;

  if (filenames.some((filename) => filename === query)) return 0;
  if (filenames.some((filename) => filename.startsWith(query))) return 1;
  if (filenames.some((filename) => filename.includes(query) || terms.some((term) => filename.includes(term)))) return 2;

  const matchesTerms = (values: string[]) => terms.every((term) => values.some((value) => value.includes(term)));
  if (paths.some((path) => path.includes(query)) || matchesTerms(paths)) return 3;
  if (descriptions.some((description) => description.includes(query)) || matchesTerms(descriptions)) return 4;
  return 5;
}

function ActivityTimeline({
  query,
  activityType,
  extension,
  title = "Recent Activities",
  onActivitySelect,
  onClear,
  onViewAll,
}: ActivityTimelineProps) {
  const { type: intentType, text: searchText } = getSearchIntent(query.trim());
  const normalizedQuery = searchText.toLowerCase().trim();
  const queryTerms = normalizedQuery
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term && !searchStopWords.has(term));

  const filteredActivities = mockActivities
    .map((activity) => {
      const file = mockFiles.find((record) => record.id === activity.fileId);
      const fileExtension = file?.extension.toLowerCase() ?? "";
      const filenames = getFilenameCandidates(activity, file?.name);
      const paths = [activity.file, file?.path].filter(Boolean).map((value) => value!.toLowerCase());
      const descriptions = [
        activity.description,
        activity.type,
        ...eventSearchTerms[activity.type],
      ].map((value) => value.toLowerCase());

      if (activityType !== "all" && activity.type !== activityType) {
        return null;
      }

      if (intentType && activity.type !== intentType) return null;
      if (extension !== "all" && fileExtension !== extension.toLowerCase()) {
        return null;
      }

      const searchableText = [...filenames, ...paths, ...descriptions, fileExtension];
      const matchesQuery = queryTerms.every((term) => searchableText.some((value) => value.includes(term)));
      if (!matchesQuery) return null;

      return {
        activity,
        rank: getRelevanceRank(normalizedQuery, queryTerms, filenames, paths, descriptions),
      };
    })
    .filter((result): result is { activity: Activity; rank: number } => result !== null)
    .sort((a, b) => a.rank - b.rank || Date.parse(b.activity.timestamp) - Date.parse(a.activity.timestamp))
    .map(({ activity }) => activity);

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
