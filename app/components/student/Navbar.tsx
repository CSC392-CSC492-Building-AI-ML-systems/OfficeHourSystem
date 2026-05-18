// components/student/Navbar.tsx
import { UserCircle, LogOut } from "lucide-react";

interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName = "Student" }: NavbarProps) {
  return (
    <header className="flex justify-between items-center border-b pb-4 mb-8">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          OHMS
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-3">
          <p className="text-sm font-semibold text-slate-900">{userName}</p>
          <UserCircle className="w-8 h-8 text-slate-400" />
        </div>

        <button
          title="Logout"
          className="text-slate-400 hover:text-red-600 transition-colors ml-2"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
