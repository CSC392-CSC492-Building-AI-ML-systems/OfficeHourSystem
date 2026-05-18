// components/student/StudentDashboard.tsx
import { Bell, UserCircle, Calendar, Bug, Users } from "lucide-react";
import { DropInCard } from "./cards/DropInCard";
import { QueueCard } from "./cards/QueueCard";
import { GroupTopicCard } from "./cards/GroupTopicCard";
import { FeatureBanner } from "./cards/FeatureBanner";

export default function StudentDashboard() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Top Navigation */}
      <header className="flex justify-between items-center border-b pb-4 mb-8">
        <div className="flex items-center space-x-6">
          <h1 className="text-2xl font-bold text-slate-900">OHMS</h1>
          <nav>
            <span className="text-slate-900 font-medium border-b-2 border-red-600 pb-5">
              Dashboard
            </span>
          </nav>
        </div>
        <div className="flex space-x-4 text-slate-600">
          <Bell className="w-6 h-6 cursor-pointer hover:text-slate-900 transition-colors" />
          <UserCircle className="w-6 h-6 cursor-pointer hover:text-slate-900 transition-colors" />
        </div>
      </header>

      {/* Welcome Section
      <section className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome back, Alex!</h2>
        <p className="text-slate-600">CSC108: Introduction to Computer Programming.</p>
      </section> */}

      {/* Triple Stream Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Column 1: Drop-In */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">
              Drop-In Office Hours
            </h3>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Open-door static sessions for quick questions and conceptual
            clarifications. No registration required.
          </p>

          <DropInCard
            title="Morning Session"
            time="10:00 AM - 12:00 PM"
            location="BA 3110 (In-Person)"
            taName="Sarah Chen"
          />
          <DropInCard
            title="Evening Session"
            time="6:00 PM - 8:00 PM"
            location="Online (Zoom Link)"
            taName="James Miller"
          />
        </div>

        {/* Column 2: Debugging Queue */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <Bug className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">
              Debugging Queue
            </h3>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            {
              "Join a specific TA's queue for 1:1 technical support with complex code bugs and assignment blockers."
            }
          </p>

          <QueueCard taName="David Wu" location="BA 3110 (In-Person)" />
          <QueueCard
            taName="Sarah Chen"
            location="Online (Zoom Link)"
            isOnline={true}
          />
        </div>

        {/* Column 3: Group Topic */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-lg text-slate-900">
              Group Topic sessions
            </h3>
          </div>
          <p className="text-sm text-slate-600 mb-6">
            Small-group learning sessions focused on specific curriculum
            modules. Limited capacity.
          </p>

          <GroupTopicCard
            topic="Linked Lists Deep-Dive"
            timeString="Today, 2:00 PM"
          />
          <GroupTopicCard
            topic="Recursion Workshop"
            timeString="Today, 3:30 PM"
          />
        </div>
      </section>

      <FeatureBanner
        title="Enhance Your Learning Experience"
        description="Our Triple-Stream system ensures you get the right support at the right time. From quick questions to deep technical debugging."
        buttonText="How it works"
      />
    </div>
  );
}
