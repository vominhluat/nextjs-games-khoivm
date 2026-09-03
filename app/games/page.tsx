import type { Metadata } from "next";
import Link from "next/link";
import { games } from "@/lib/games";

export const metadata: Metadata = {
  title: "Games | Games Hub",
  description: "Danh sách các trò chơi mini.",
};

export default function GamesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Games</h1>
      <p className="mt-2 text-foreground/70">
        Chọn một trò chơi để bắt đầu chơi.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {games.map((game) => {
          const available = game.status === "available";
          const card = (
            <div className="flex h-full flex-col gap-3 rounded-2xl border border-black/[.08] p-6 transition-colors dark:border-white/[.12]">
              <span className="text-3xl">{game.emoji}</span>
              <span className="text-lg font-semibold">{game.title}</span>
              <span className="text-sm text-foreground/60">
                {game.description}
              </span>
              <span
                className={`mt-auto w-fit rounded-full px-2.5 py-1 text-xs font-medium ${
                  available
                    ? "bg-green-500/15 text-green-600 dark:text-green-400"
                    : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                }`}
              >
                {available ? "Chơi ngay" : "Sắp ra mắt"}
              </span>
            </div>
          );

          return available ? (
            <Link
              key={game.slug}
              href={`/games/${game.slug}`}
              className="hover:border-foreground/30 hover:bg-black/[.03] rounded-2xl dark:hover:bg-white/[.06]"
            >
              {card}
            </Link>
          ) : (
            <div key={game.slug} className="cursor-not-allowed opacity-60">
              {card}
            </div>
          );
        })}
      </div>
    </main>
  );
}
