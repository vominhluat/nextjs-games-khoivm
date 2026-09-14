import type { Metadata } from "next";
import FacesGame from "@/components/games/faces/FacesGame";

export const metadata: Metadata = {
  title: "Faces | Games Hub",
  description: "Đảo biểu cảm để đưa cả bốn khuôn mặt về trạng thái vui vẻ.",
};

export default function FacesPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <FacesGame />
    </main>
  );
}
