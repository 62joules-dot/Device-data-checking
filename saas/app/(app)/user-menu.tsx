"use client";

import { useEffect, useRef, useState } from "react";

export default function UserMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
      >
        {email}
        <span className="text-xs text-zinc-400">▾</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-zinc-200 bg-white py-1.5 text-sm shadow-lg">
          <a href="/settings" className="block px-4 py-2 text-zinc-700 hover:bg-zinc-50">
            Réglages
          </a>
          <form action="/auth/signout" method="post">
            <button type="submit" className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-50">
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
