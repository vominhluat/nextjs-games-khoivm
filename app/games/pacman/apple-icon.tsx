import { ImageResponse } from "next/og";
import { PacmanGlyph } from "@/components/icons/AppIcons";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<PacmanGlyph size={size.width} />, { ...size });
}
