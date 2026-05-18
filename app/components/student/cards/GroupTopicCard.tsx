// components/student/cards/GroupTopicCard.tsx

interface GroupTopicCardProps {
  topic: string;
  timeString: string;
}

export function GroupTopicCard({ topic, timeString }: GroupTopicCardProps) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border mb-4 flex justify-between items-center">
      <div>
        <h4 className="font-semibold text-slate-900">{topic}</h4>
        <p className="text-sm text-slate-600">🕒 {timeString}</p>
      </div>
      <button className="text-sm px-3 py-1 bg-white border rounded hover:bg-slate-50 text-slate-700 transition-colors">
        {"I'm interested."}
      </button>
    </div>
  );
}
