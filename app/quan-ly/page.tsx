import type { Metadata } from "next";
import { games } from "@/lib/games";

export const metadata: Metadata = {
  title: "Quản lý | Games Hub",
  description: "Tổng quan và quản lý danh mục trò chơi.",
};

export default function QuanLyPage() {
  const availableCount = games.filter((g) => g.status === "available").length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Quản lý</h1>
      <p className="mt-2 text-foreground/70">
        Tổng quan danh mục trò chơi hiện có trong ứng dụng.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/[.08] p-6 dark:border-white/[.12]">
          <p className="text-sm text-foreground/60">Tổng số game</p>
          <p className="mt-1 text-3xl font-semibold">{games.length}</p>
        </div>
        <div className="rounded-2xl border border-black/[.08] p-6 dark:border-white/[.12]">
          <p className="text-sm text-foreground/60">Đang khả dụng</p>
          <p className="mt-1 text-3xl font-semibold">{availableCount}</p>
        </div>
      </div>

      <div className="mt-10 overflow-hidden rounded-2xl border border-black/[.08] dark:border-white/[.12]">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/[.03] text-foreground/60 dark:bg-white/[.06]">
            <tr>
              <th className="px-4 py-3 font-medium">Game</th>
              <th className="px-4 py-3 font-medium">Mô tả</th>
              <th className="px-4 py-3 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={game.slug}
                className="border-t border-black/[.08] dark:border-white/[.12]"
              >
                <td className="px-4 py-3 font-medium">
                  {game.emoji} {game.title}
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {game.description}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      game.status === "available"
                        ? "bg-green-500/15 text-green-600 dark:text-green-400"
                        : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                    }`}
                  >
                    {game.status === "available" ? "Khả dụng" : "Sắp ra mắt"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
