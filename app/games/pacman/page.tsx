import type { Metadata } from "next";
import PacmanGame from "@/components/games/pacman/PacmanGame";

export const metadata: Metadata = {
  title: "Pac-Man | Games Hub",
  description: "Dot Muncher - Game mê cung ăn chấm.",
};

export default function PacmanPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <PacmanGame />
    </main>
  );
}
