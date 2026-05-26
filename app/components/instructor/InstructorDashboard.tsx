import { UserPlus } from "lucide-react";
import { Navbar } from "./Navbar";
import { StatCard } from "./cards/StatCard";
import { StaffTable } from "./cards/StaffTable";

export default function InstructorDashboard() {
  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <Navbar activeItem="dashboard" />

        <main className="mt-10 space-y-8">
          <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-[#071f41] sm:text-[2.1rem]">
                Staff Management
              </h1>
              <p className="text-base text-slate-600">
                CS 101: Introduction to Computer Science (Fall 2023)
              </p>
            </div>

            <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#071f41] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(7,31,65,0.7)] transition hover:bg-[#0f2942]">
              <UserPlus className="h-4 w-4" />
              Add TA
            </button>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="TOTAL STAFF" value="12" />
            <StatCard
              label="ACTIVE LEADS"
              value="03"
              valueClassName="text-[#c8102e]"
            />
            <StatCard
              label="WEEKLY SLOTS"
              value="42"
              valueClassName="text-[#8a5a17]"
            />
          </section>

          <StaffTable />
        </main>
      </div>
    </div>
  );
}
