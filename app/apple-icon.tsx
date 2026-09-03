import { ImageResponse } from "next/og";
import { JoystickGlyph } from "@/components/icons/AppIcons";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<JoystickGlyph size={size.width} />, { ...size });
}
