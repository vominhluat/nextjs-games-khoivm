import { ImageResponse } from "next/og";
import { PacmanGlyph } from "@/components/icons/AppIcons";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<PacmanGlyph size={size.width} />, { ...size });
}
