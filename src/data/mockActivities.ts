import type { Activity } from "../types/activity";

export const mockActivities: Activity[] = [
  {
    id: "1",
    fileId: "file-resume",
    time: "10:32",
    type: "download",
    file: "resume.pdf",
    description: "Downloaded from LinkedIn",
  },
  {
    id: "2",
    fileId: "file-resume",
    time: "10:47",
    type: "modify",
    file: "resume.pdf",
    description: "Edited · 37 changes",
  },
  {
    id: "3",
    fileId: "file-resume",
    time: "11:05",
    type: "rename",
    file: "resume_final.pdf",
    description: "Renamed from resume.pdf",
  },
  {
    id: "4",
    fileId: "file-resume",
    time: "11:08",
    type: "move",
    file: "Documents/",
    description: "Moved from Downloads",
  },
  {
    id: "5",
    fileId: "file-project",
    time: "1:08",
    type: "move",
    file: "Documents/",
    description: "Moved from Desktop",
  },
];
