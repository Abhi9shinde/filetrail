import { useId, useState, type FormEvent } from "react";
import { Folder, Plus, X } from "lucide-react";

type TrackedFoldersProps = {
  folders: string[];
  onFoldersChange: (folders: string[]) => void;
};

function TrackedFolders({ folders, onFoldersChange }: TrackedFoldersProps) {
  const inputId = useId();
  const [folderInput, setFolderInput] = useState("");
  const [feedback, setFeedback] = useState("");

  function handleAddFolder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const folder = folderInput.trim();

    if (!folder) {
      setFeedback("Enter a folder path to add it to this demo list.");
      return;
    }

    if (folders.some((existing) => existing.toLocaleLowerCase() === folder.toLocaleLowerCase())) {
      setFeedback("That folder is already in the demo list.");
      return;
    }

    onFoldersChange([...folders, folder]);
    setFolderInput("");
    setFeedback(`Added ${folder} to the demo list.`);
  }

  function handleRemoveFolder(folder: string) {
    onFoldersChange(folders.filter((item) => item !== folder));
    setFeedback(`Removed ${folder} from the demo list.`);
  }

  return (
    <section aria-labelledby="tracked-folders-title" className="max-w-3xl">
      <div className="mb-7">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
          Settings
        </p>
        <h1 id="tracked-folders-title" className="text-3xl font-medium tracking-[-0.03em] text-zinc-100">
          Tracked folders
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-500">
          Manage example folders for this prototype.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-blue-400/[0.14] bg-blue-400/[0.045] px-4 py-3">
          <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" aria-hidden="true" />
          <p className="text-xs leading-5 text-zinc-400">
            Demonstration settings only. These folders are not monitored and this list is not saved.
          </p>
        </div>

        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium text-zinc-200">Folders in this demo</h2>
          <span className="text-xs text-zinc-600">{folders.length}</span>
        </div>

        {folders.length > 0 ? (
          <ul className="divide-y divide-white/[0.06] rounded-lg border border-white/[0.06]">
            {folders.map((folder) => (
              <li key={folder} className="flex min-w-0 items-center gap-3 px-3 py-3 sm:px-4">
                <Folder className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-300" title={folder}>
                  {folder}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveFolder(folder)}
                  aria-label={`Remove ${folder}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-dashed border-white/[0.1] px-4 py-8 text-center">
            <Folder className="mx-auto mb-2 h-5 w-5 text-zinc-600" aria-hidden="true" />
            <p className="text-sm text-zinc-400">No folders in this demo yet</p>
            <p className="mt-1 text-xs text-zinc-600">Add a folder path below to see it here.</p>
          </div>
        )}

        <form onSubmit={handleAddFolder} className="mt-5">
          <label htmlFor={inputId} className="mb-2 block text-xs font-medium text-zinc-400">
            Add a folder path
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id={inputId}
              type="text"
              value={folderInput}
              onChange={(event) => setFolderInput(event.target.value)}
              placeholder="Example: C:\\Projects\\Design"
              className="min-w-0 flex-1 rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 transition-colors focus:border-blue-400/50 focus-visible:ring-2 focus-visible:ring-blue-400/40"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/70"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add folder
            </button>
          </div>
          <p className="mt-2 min-h-5 text-xs text-zinc-500" role="status" aria-live="polite">
            {feedback}
          </p>
        </form>
      </div>
    </section>
  );
}

export default TrackedFolders;
