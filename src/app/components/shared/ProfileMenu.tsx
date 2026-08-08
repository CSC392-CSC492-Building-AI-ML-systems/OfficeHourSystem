"use client";

import Link from "next/link";
import { LogOut, PanelsTopLeft, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ProfileUser = {
  firstName: string;
  lastName: string;
  utorid: string;
  canSwitchView: boolean;
};

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me");
        if (!response.ok) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const data = (await response.json()) as ProfileUser;
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

  async function logOut() {
    setLoggingOut(true);
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (response.ok) {
      window.location.replace("/");
      return;
    }
    setLoggingOut(false);
  }

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
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_18px_50px_-30px_rgba(15,41,66,0.45)]"
        >
          <div className="px-4 py-3 text-sm">
            {loadError && !user ? (
              <p className="text-slate-500">Unable to load profile.</p>
            ) : !user ? (
              <p className="text-slate-500">Loading...</p>
            ) : (
              <div>
                <p className="font-semibold text-[#071f41]">{fullName}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {user.utorid}
                </p>
              </div>
            )}
          </div>
          <div className="border-t border-slate-100 p-2">
            {user?.canSwitchView ? (
              <Link
                role="menuitem"
                href="/switch-view"
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#071f41] hover:bg-slate-50"
              >
                <PanelsTopLeft className="h-4 w-4" />
                Switch view
              </Link>
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={() => void logOut()}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#071f41] hover:bg-slate-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
