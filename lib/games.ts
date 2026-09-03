export interface GameMeta {
  slug: string;
  title: string;
  description: string;
  emoji: string;
  status: "available" | "coming-soon";
}

export const games: GameMeta[] = [
  {
    slug: "pacman",
    title: "Dot Muncher (Pac-Man)",
    description:
      "Mê cung ăn chấm cổ điển: né bóng ma, ăn viên năng lượng để tạm thời phản công.",
    emoji: "\u{1F47B}",
    status: "available",
  },
];

export function getGameBySlug(slug: string): GameMeta | undefined {
  return games.find((game) => game.slug === slug);
}
