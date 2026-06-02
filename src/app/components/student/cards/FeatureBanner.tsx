import { ArrowRight } from "lucide-react";

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
    <section className="relative overflow-hidden rounded-[32px] border border-[#12365f] bg-[linear-gradient(135deg,#071f41_0%,#0f2942_42%,#1a4169_100%)] px-8 py-10 text-white shadow-[0_24px_60px_-36px_rgba(7,31,65,0.9)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,16,46,0.22),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(96,165,250,0.18),transparent_28%)]" />
      <div className="absolute -right-16 top-8 h-44 w-44 rounded-full border border-white/10 bg-white/5" />
      <div className="absolute bottom-0 right-20 h-28 w-28 rounded-full border border-white/10 bg-white/5" />

      <div className="relative z-10 max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-[2rem]">
          {title}
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
          {description}
        </p>
        <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#071f41] transition hover:bg-slate-100">
          <span>{buttonText}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
