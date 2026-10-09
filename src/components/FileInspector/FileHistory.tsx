import type { Activity } from "../../types/activity";

import FileHistoryItem from "./FileHistoryItem";

type FileHistoryProps = {
  activities: Activity[];
};

function FileHistory({ activities }: FileHistoryProps) {
  const newestFirst = [...activities].sort(
    (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp),
  );

  return (
    <div>
      {newestFirst.map((activity) => (
        <FileHistoryItem key={activity.id} activity={activity} />
      ))}
    </div>
  );
}

export default FileHistory;
