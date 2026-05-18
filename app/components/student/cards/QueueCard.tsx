// components/student/cards/QueueCard.tsx

interface QueueCardProps {
  taName: string;
  location: string;
  isOnline?: boolean;
}

export function QueueCard({
  taName,
  location,
  isOnline = false,
}: QueueCardProps) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border mb-4">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="font-semibold text-slate-900">{taName}</h4>
          <p
            className={`text-sm font-medium ${isOnline ? "text-blue-600" : "text-red-600"}`}
          >
            {isOnline ? "💻 " : "📍 "}
            {location}
          </p>
        </div>
        <button className="text-sm px-3 py-1 bg-white border rounded hover:bg-slate-50 text-slate-700 transition-colors">
          {"I'm interested."}
        </button>
      </div>
    </div>
  );
}
