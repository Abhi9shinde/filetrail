export type ActivityType = "download" | "modify" | "rename" | "move" | "delete";

export type Activity = {
  id: string;
  fileId: string;
  time: string;
  type: ActivityType;
  file: string;
  description: string;
};
