// components/instructor/Navbar.tsx
import { UserCircle, LogOut } from "lucide-react";

interface NavbarProps {
  userName?: string;
}

export function Navbar({ userName = "Alex" }: NavbarProps) {
  return (
    <header className="flex justify-between items-center border-b border-slate-200 pb-4 mb-8 bg-[#f8fafc]">
      {/* Left Side: Brand Logo and Navigation Links from Screenshot */}
      <div className="flex items-center space-x-10">
        <h1 className="text-xl font-black text-[#0f2942] tracking-wider">
          OHMS
        </h1>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <a
            href="#dashboard"
            className="text-slate-900 hover:text-[#0f2942] transition-colors"
          >
            Dashboard
          </a>
          <a
            href="#my-queues"
            className="text-slate-500 hover:text-[#0f2942] transition-colors"
          >
            My Queues
          </a>
          <a
            href="#schedule"
            className="text-slate-500 hover:text-[#0f2942] transition-colors"
          >
            Schedule
          </a>
        </nav>
      </div>

      {/* Right Side: Replicated exactly from the Student Navbar layout */}
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
