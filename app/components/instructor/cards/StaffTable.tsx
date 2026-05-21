// components/instructor/cards/StaffTable.tsx
import { Trash2, MapPin, Video, ChevronLeft, ChevronRight } from "lucide-react";

// we will use this mock data for now, later we will fetch data from the database
const staffRoster = [
  {
    id: "1",
    name: "Sarah Chen",
    role: "Grad Student",
    isLead: true,
    email: "s.chen@university.edu",
    location: "Tech Plaza, Rm 402",
    isOnline: false,
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  },
  {
    id: "2",
    name: "Marcus Holloway",
    role: "Senior Undergraduate",
    isLead: false,
    email: "m.holloway@university.edu",
    location: "Science Center, Lab 1B",
    isOnline: false,
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  },
  {
    id: "3",
    name: "Elena Rodriguez",
    role: "Masters Student",
    isLead: false,
    email: "e.rodriguez@university.edu",
    location: "Remote (Zoom)",
    isOnline: true,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
  },
];

export function StaffTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Clean Table Header without search bar */}
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-base text-[#0f2942]">
          Current Teaching Assistants
        </h3>
      </div>

      {/* Responsive Table Grid */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#eef2f6]/50 border-b border-slate-200 text-[11px] font-bold text-slate-500 tracking-wider">
              <th className="px-6 py-3.5">STAFF MEMBER</th>
              <th className="px-6 py-3.5">ROLE</th>
              <th className="px-6 py-3.5">CONTACT INFO</th>
              <th className="px-6 py-3.5">OFFICE LOCATION</th>
              <th className="px-6 py-3.5 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {staffRoster.map((ta) => (
              <tr
                key={ta.id}
                className="hover:bg-slate-50/40 transition-colors"
              >
                {/* Profile Identity block */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <img
                      src={ta.avatar}
                      alt={ta.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-100"
                    />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {ta.name}
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        {ta.role}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Role Badge */}
                <td className="px-6 py-4 whitespace-nowrap">
                  {ta.isLead ? (
                    <span className="inline-flex items-center bg-[#002244] text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide">
                      LEAD TA
                    </span>
                  ) : (
                    <span className="inline-flex items-center bg-[#dae2ec] text-[#627d98] text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
                      TA
                    </span>
                  )}
                </td>

                {/* Email Info */}
                <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-600">
                  {ta.email}
                </td>

                {/* Location with reactive icons */}
                <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                  <div className="flex items-center gap-1.5">
                    {ta.isOnline ? (
                      <Video className="w-4 h-4 text-slate-400" />
                    ) : (
                      <MapPin className="w-4 h-4 text-slate-400" />
                    )}
                    <span>{ta.location}</span>
                  </div>
                </td>

                {/* Remove Action Trigger */}
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button className="inline-flex items-center gap-1 text-[#b91c1c] hover:text-[#991b1b] font-bold text-xs transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
        <span>Showing 3 of 12 staff members</span>
        <div className="flex items-center gap-2">
          <button className="w-7 h-7 inline-flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 inline-flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:bg-slate-50 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
