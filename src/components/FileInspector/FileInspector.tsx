import { X } from "lucide-react";
import type { FileRecord } from "../../types/file";
import { mockActivities } from "../../data/mockActivities";
import FileHistory from "./FileHistory";

type FileInspectorProps = {
  file: FileRecord;
  onClose: () => void;
};

function FileInspector({ file, onClose }: FileInspectorProps) {
  const fileActivities = mockActivities.filter(
    (activity) => activity.fileId === file.id,
  );
  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-white/[0.06] bg-[#0d0d0f]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
            File
          </p>

          <h2 className="mt-1 text-sm font-medium text-zinc-200">
            {file.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-white/[0.05] hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
          aria-label="Close file inspector"
        >
          <X size={15} strokeWidth={1.8} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div>
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
            History
          </p>

          <FileHistory activities={fileActivities} />
        </div>
      </div>
    </aside>
  );
}

export default FileInspector;
