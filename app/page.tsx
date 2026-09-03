import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Games Hub
        </h1>
        <p className="max-w-xl text-lg leading-8 text-foreground/70">
          Nơi tổng hợp các trò chơi mini và trang quản lý cho ứng dụng.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link
          href="/quan-ly"
          className="group flex flex-col items-start gap-2 rounded-2xl border border-black/[.08] p-6 text-left transition-colors hover:border-foreground/30 hover:bg-black/[.03] dark:border-white/[.12] dark:hover:bg-white/[.06]"
        >
          <span className="text-2xl">🗂️</span>
          <span className="text-lg font-semibold">Quản lý</span>
          <span className="text-sm text-foreground/60">
            Xem tổng quan và quản lý danh mục trò chơi.
          </span>
        </Link>

        <Link
          href="/games"
          className="group flex flex-col items-start gap-2 rounded-2xl border border-black/[.08] p-6 text-left transition-colors hover:border-foreground/30 hover:bg-black/[.03] dark:border-white/[.12] dark:hover:bg-white/[.06]"
        >
          <span className="text-2xl">🎮</span>
          <span className="text-lg font-semibold">Games</span>
          <span className="text-sm text-foreground/60">
            Chơi các trò chơi mini, bắt đầu với Pac-Man.
          </span>
        </Link>
      </div>
    </main>
  );
}
