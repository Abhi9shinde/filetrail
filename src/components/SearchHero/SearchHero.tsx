import type { RefObject } from "react";
import type { ActivityType } from "../../types/activity";

type SearchHeroProps = {
  query: string;
  onQueryChange: (query: string) => void;
  inputRef: RefObject<HTMLInputElement>;
  activityType: ActivityType | "all";
  onActivityTypeChange: (activityType: ActivityType | "all") => void;
  extension: string;
  extensions: string[];
  onExtensionChange: (extension: string) => void;
  onClear: () => void;
};

const eventTypes: { value: ActivityType; label: string }[] = [
  { value: "download", label: "Downloaded" },
  { value: "modify", label: "Modified" },
  { value: "rename", label: "Renamed" },
  { value: "move", label: "Moved" },
  { value: "delete", label: "Deleted" },
];

const suggestions = [
  { label: "PDF files", query: "pdf" },
  { label: "Recently renamed", query: "rename" },
  { label: "Files from LinkedIn", query: "LinkedIn" },
];

function SearchHero({
  query,
  onQueryChange,
  inputRef,
  activityType,
  onActivityTypeChange,
  extension,
  extensions,
  onExtensionChange,
  onClear,
}: SearchHeroProps) {
  const hasFilters = query.trim().length > 0 || activityType !== "all" || extension !== "all";

  return (
    <section className="pt-16" aria-labelledby="search-heading">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        File memory
      </p>

      <h1 id="search-heading" className="max-w-2xl text-4xl font-medium tracking-[-0.03em] text-zinc-100">
        Find anything you've touched.
      </h1>

      <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-500">
        Search your files by name, extension, event, or description.
      </p>

      <div className="mt-8 max-w-2xl">
        <div className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 transition-colors duration-200 hover:border-white/[0.14] focus-within:border-white/[0.18]">
          <span aria-hidden="true" className="text-lg text-zinc-500">⌕</span>

          <input
            ref={inputRef}
            id="filetrail-search"
            type="search"
            aria-keyshortcuts="Control+K Meta+K"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Try ‘resume’, ‘pdf’, or ‘renamed’"
            aria-label="Search demonstration activity"
            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
          />

          <kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-600 sm:block">
            Ctrl K
          </kbd>
        </div>
      </div>

      <div className="mt-3 flex max-w-2xl flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="activity-type-filter">Filter by event type</label>
        <select
          id="activity-type-filter"
          value={activityType}
          onChange={(event) => onActivityTypeChange(event.target.value as ActivityType | "all")}
          className="rounded-lg border border-white/[0.08] bg-[#111113] px-3 py-2 text-xs text-zinc-400 outline-none transition-colors hover:border-white/[0.14] focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400"
        >
          <option value="all">All event types</option>
          {eventTypes.map((eventType) => (
            <option key={eventType.value} value={eventType.value}>{eventType.label}</option>
          ))}
        </select>

        <label className="sr-only" htmlFor="file-extension-filter">Filter by file extension</label>
        <select
          id="file-extension-filter"
          value={extension}
          onChange={(event) => onExtensionChange(event.target.value)}
          className="rounded-lg border border-white/[0.08] bg-[#111113] px-3 py-2 text-xs text-zinc-400 outline-none transition-colors hover:border-white/[0.14] focus-visible:border-blue-400 focus-visible:ring-1 focus-visible:ring-blue-400"
        >
          <option value="all">All extensions</option>
          {extensions.map((fileExtension) => (
            <option key={fileExtension} value={fileExtension}>.{fileExtension}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-md px-2 py-2 text-xs text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          >
            Clear search and filters
          </button>
        )}
      </div>

      <div className="mt-4 flex max-w-2xl flex-wrap gap-2" role="group" aria-label="Suggested searches">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.label}
            type="button"
            onClick={() => {
              onQueryChange(suggestion.query);
              inputRef.current?.focus();
            }}
            className="rounded-full border border-white/[0.06] px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-white/[0.12] hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  );
}

export default SearchHero;
