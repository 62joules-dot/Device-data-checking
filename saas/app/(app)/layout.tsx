import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavLinks from "./nav-links";
import UserMenu from "./user-menu";

function todayLabel() {
  const s = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-zinc-200 bg-white md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-b-0 md:border-r">
        <div className="px-5 py-4 md:py-6">
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            62<span className="text-blue-600">joules</span>
          </span>
        </div>
        <div className="px-3 pb-3 md:pb-6">
          <NavLinks />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-3">
            <span className="text-sm font-medium text-zinc-600">{todayLabel()}</span>
            <UserMenu email={user.email ?? ""} />
          </div>
        </header>
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </div>
    </div>
  );
}
