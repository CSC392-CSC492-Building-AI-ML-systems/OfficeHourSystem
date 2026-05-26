import Link from "next/link";
import { Bell, UserCircle } from "lucide-react";

export function Navbar() {
  return (
    <header className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-4 shadow-[0_16px_40px_-32px_rgba(15,41,66,0.35)] sm:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-2xl font-black tracking-[0.22em] text-[#071f41]"
          >
            OHMS
          </Link>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-500">
            <span className="relative pb-3 text-[#071f41]">
              Dashboard
              <span className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-[#c8102e]" />
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            type="button"
            aria-label="Notifications"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:text-[#071f41]"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Profile"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#071f41] text-white shadow-sm transition hover:bg-[#0f2942]"
          >
            <UserCircle className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
