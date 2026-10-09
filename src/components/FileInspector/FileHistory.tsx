import type { Activity } from "../../types/activity";

import FileHistoryItem from "./FileHistoryItem";

type FileHistoryProps = {
  activities: Activity[];
};

function FileHistory({ activities }: FileHistoryProps) {
  return (
    <div>
      {activities.map((activity) => (
        <FileHistoryItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

export default FileHistory;
