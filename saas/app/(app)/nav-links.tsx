"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Stock Appareils" },
  { href: "/tracking", label: "Suivi" },
  { href: "/analytics", label: "Tableau de bord" },
  { href: "/pricing", label: "Simulateur de prix" },
  { href: "/emails", label: "Emails" },
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/images", label: "Images" },
];

export default function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {LINKS.map((link) => {
        const active = link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
