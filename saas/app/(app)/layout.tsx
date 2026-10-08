import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NavLinks from "./nav-links";
import UserMenu from "./user-menu";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-sm font-semibold tracking-tight text-zinc-900">
              62<span className="text-blue-600">joules</span>
            </span>
            <NavLinks />
          </div>
          <UserMenu email={user.email ?? ""} />
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </div>
  );
}
