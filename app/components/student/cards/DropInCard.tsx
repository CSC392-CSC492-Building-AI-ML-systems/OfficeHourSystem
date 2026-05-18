// components/student/cards/DropInCard.tsx

interface DropInCardProps {
  title: string;
  time: string;
  location: string;
  taName: string;
}

export function DropInCard({ title, time, location, taName }: DropInCardProps) {
  return (
    <div className="bg-slate-50 p-4 rounded-lg border mb-4">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-slate-900">{title}</h4>
        <button className="text-sm px-3 py-1 bg-white border rounded hover:bg-slate-50 text-slate-700 transition-colors">
          {"I'm interested."}
        </button>
      </div>
      <div className="text-sm text-slate-600 space-y-1">
        <p>🕒 {time}</p>
        <p>📍 {location}</p>
        <p>👤 TA: {taName}</p>
      </div>
    </div>
  );
}
