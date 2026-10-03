import { useState } from "react";
import SearchHero from "../../components/SearchHero";
import ActivityTimeline from "../../components/ActivityTimeline";
import FileInspector from "../../components/FileInspector";
import { mockFiles } from "../../data/mockFiles";
import type { FileRecord } from "../../types/file";

function Home() {
  const [query, setQuery] = useState("");

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const selectedFile: FileRecord | null =
    mockFiles.find((file) => file.id === selectedFileId) ?? null;

  return (
    <main className="flex min-h-screen flex-1 overflow-hidden bg-[#0b0b0d] text-zinc-100">
      <div className="flex-1 overflow-y-auto px-10">
        <div className="mx-auto max-w-5xl">
          <SearchHero query={query} onQueryChange={setQuery} />

          <ActivityTimeline
            query={query}
            onActivitySelect={(activity) => setSelectedFileId(activity.fileId)}
          />
        </div>
      </div>

      {selectedFileId && (
        <FileInspector
          file={selectedFile}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </main>
  );
}

export default Home;
