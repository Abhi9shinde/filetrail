import type { Activity } from "../types/activity";

export const mockActivities: Activity[] = [
  {
    id: "1",
    fileId: "file-resume",
    timestamp: "2025-02-14T10:32:00-05:00",
    type: "download",
    file: "resume.pdf",
    description: "Downloaded from LinkedIn",
  },
  {
    id: "2",
    fileId: "file-resume",
    timestamp: "2025-02-14T10:47:00-05:00",
    type: "modify",
    file: "resume.pdf",
    description: "Edited",
  },
  {
    id: "3",
    fileId: "file-resume",
    timestamp: "2025-02-14T11:05:00-05:00",
    type: "rename",
    file: "resume_final.pdf",
    description: "Renamed from resume.pdf",
  },
  {
    id: "4",
    fileId: "file-resume",
    timestamp: "2025-02-14T11:08:00-05:00",
    type: "move",
    file: "Documents/",
    description: "Moved from Downloads",
  },
  {
    id: "5",
    fileId: "file-project",
    timestamp: "2025-02-14T13:08:00-05:00",
    type: "move",
    file: "Documents/",
    description: "Moved from Desktop",
  },
];
