// components/instructor/InstructorDashboard.tsx
import { UserPlus } from "lucide-react";
import { Navbar } from "./Navbar";
import { StaffTable } from "./cards/StaffTable";

export default function InstructorDashboard() {
  return (
    <div className="w-full min-h-screen bg-[#f8fafc] text-slate-900 pb-12">
      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto px-6 pt-2">
        <Navbar userName="Alex" />
      </div>

      <main className="max-w-7xl mx-auto p-6">
        {/* Header Title Banner */}
        <section className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#0f2942]">
              Staff Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              CS 101: Introduction to Computer Science (Fall 2023)
            </p>
          </div>
          <div>
            <button className="inline-flex items-center gap-2 bg-[#0f2942] hover:bg-[#163b5f] text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm transition-colors">
              <UserPlus className="w-4 h-4" />
              Add TA
            </button>
          </div>
        </section>

        {/* Extracted Roster Table Component */}
        <section className="mt-8">
          <StaffTable />
        </section>
      </main>
    </div>
  );
}
