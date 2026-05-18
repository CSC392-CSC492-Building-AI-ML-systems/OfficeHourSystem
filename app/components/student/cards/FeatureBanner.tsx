// components/student/cards/FeatureBanner.tsx
import { Info } from "lucide-react";

interface FeatureBannerProps {
  title: string;
  description: string;
  buttonText: string;
}

export function FeatureBanner({
  title,
  description,
  buttonText,
}: FeatureBannerProps) {
  return (
    <section className="bg-slate-900 rounded-xl p-8 text-white flex flex-col items-start relative overflow-hidden">
      {/* Decorative background element to mimic the design's abstract shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full -mr-20 -mt-20 blur-3xl" />

      <div className="relative z-10 max-w-xl">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-slate-300 mb-6">{description}</p>
        <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg">
          <Info className="w-5 h-5" />
          <span>{buttonText}</span>
        </button>
      </div>
    </section>
  );
}
