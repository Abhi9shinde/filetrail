import { useEffect, useRef, useState } from "react";
import SearchHero from "../../components/SearchHero";
import ActivityTimeline from "../../components/ActivityTimeline";
import FileInspector from "../../components/FileInspector";
import TrackedFolders from "../../components/TrackedFolders";
import { mockFiles } from "../../data/mockFiles";
import type { ActivityType } from "../../types/activity";
import type { AppSection } from "../../types/navigation";
import type { FileRecord } from "../../types/file";

type HomeProps = {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
};

function Home({ activeSection, onNavigate }: HomeProps) {
  const [trackedFolders, setTrackedFolders] = useState([
    "C:\\Users\\You\\Documents",
    "C:\\Users\\You\\Downloads",
  ]);
  const [query, setQuery] = useState("");
  const [activityType, setActivityType] = useState<ActivityType | "all">("all");
  const [extension, setExtension] = useState("all");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedFile: FileRecord | null =
    mockFiles.find((file) => file.id === selectedFileId) ?? null;
  const extensions = Array.from(new Set(mockFiles.map((file) => file.extension)))
    .sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (activeSection === "Search") {
      searchInputRef.current?.focus();
    }
  }, [activeSection]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onNavigate("Search");
        searchInputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [onNavigate]);

  function clearSearchAndFilters() {
    setQuery("");
    setActivityType("all");
    setExtension("all");
  }

  if (activeSection === "Settings") {
    return (
      <main className="flex min-h-screen min-w-0 flex-1 overflow-hidden bg-[#0b0b0d] text-zinc-100">
        <div className="flex-1 overflow-y-auto px-6 sm:px-10">
          <div className="mx-auto max-w-5xl pt-16">
            <TrackedFolders folders={trackedFolders} onFoldersChange={setTrackedFolders} />
          </div>
        </div>
      </main>
    );
  }

  if (activeSection === "Starred") {
    return (
      <main className="flex min-h-screen min-w-0 flex-1 overflow-hidden bg-[#0b0b0d] text-zinc-100">
        <div className="flex-1 overflow-y-auto px-6 sm:px-10">
          <section className="mx-auto max-w-5xl pt-16" aria-labelledby="starred-heading">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Library
            </p>
            <h1 id="starred-heading" className="text-3xl font-medium tracking-[-0.03em] text-zinc-100">
              Starred
            </h1>
            <div className="mt-10 max-w-2xl border-t border-white/[0.06] py-10 text-center">
              <p className="text-sm text-zinc-400">No starred files in this demo</p>
              <p className="mt-1 text-xs text-zinc-600">
                Starred files are not part of the current prototype yet.
              </p>
              <button
                type="button"
                onClick={() => onNavigate("Activity")}
                className="mt-4 rounded-md px-3 py-2 text-xs text-zinc-300 transition-colors hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
              >
                Browse activity
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen min-w-0 flex-1 overflow-hidden bg-[#0b0b0d] text-zinc-100">
      <div className="flex-1 overflow-y-auto px-6 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <SearchHero
            query={query}
            onQueryChange={setQuery}
            inputRef={searchInputRef}
            activityType={activityType}
            onActivityTypeChange={setActivityType}
            extension={extension}
            extensions={extensions}
            onExtensionChange={setExtension}
            onClear={clearSearchAndFilters}
          />

          <ActivityTimeline
            query={query}
            activityType={activityType}
            extension={extension}
            title={activeSection === "Activity" ? "Activity" : "Recent Activities"}
            onActivitySelect={(activity) => setSelectedFileId(activity.fileId)}
            onClear={clearSearchAndFilters}
            onViewAll={() => onNavigate("Activity")}
          />
        </div>
      </div>

      {selectedFile && (
        <FileInspector
          file={selectedFile}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </main>
  );
}

export default Home;
