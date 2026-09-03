"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/quan-ly", label: "Quản lý" },
  { href: "/games", label: "Games" },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-black/[.08] bg-white/80 backdrop-blur dark:border-white/[.12] dark:bg-black/60">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="font-semibold tracking-tight">
          Games Hub
        </Link>
        <ul className="flex items-center gap-1 text-sm font-medium">
          {LINKS.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-full px-4 py-2 transition-colors ${
                    active
                      ? "bg-foreground text-background"
                      : "text-foreground/70 hover:bg-black/[.05] hover:text-foreground dark:hover:bg-white/[.08]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
