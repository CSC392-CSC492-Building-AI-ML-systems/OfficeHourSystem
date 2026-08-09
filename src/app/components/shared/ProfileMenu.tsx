"use client";

import { useEffect, useRef, useState } from "react";
import { UserCircle } from "lucide-react";

type ProfileUser = {
  firstName: string;
  lastName: string;
  utorid: string;
};

type ProfileMenuProps = {
  /** Shown only on course-scoped pages, e.g. "CSC108 · Term 20265". */
  courseLabel?: string;
};

export function ProfileMenu({ courseLabel }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loadError, setLoadError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const data = (await res.json()) as ProfileUser;
        if (!cancelled) {
          setUser(data);
          setLoadError(false);
        }
      } catch {
        if (!cancelled) setLoadError(true);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const fullName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.utorid
    : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Profile"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#071f41] text-white shadow-sm transition hover:bg-[#0f2942]"
      >
        <UserCircle className="h-6 w-6" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.45)]"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Profile
            </p>
          </div>
          <div className="space-y-3 px-4 py-3 text-sm">
            {loadError && !user ? (
              <p className="text-slate-500">Unable to load profile.</p>
            ) : !user ? (
              <p className="text-slate-500">Loading…</p>
            ) : (
              <>
                <div>
                  <p className="text-xs text-slate-400">Full name</p>
                  <p className="mt-0.5 font-semibold text-[#071f41]">
                    {fullName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">UTORid</p>
                  <p className="mt-0.5 font-mono text-[#071f41]">
                    {user.utorid}
                  </p>
                </div>
                {courseLabel ? (
                  <div>
                    <p className="text-xs text-slate-400">Course + Session</p>
                    <p className="mt-0.5 font-semibold text-[#071f41]">
                      {courseLabel}
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
