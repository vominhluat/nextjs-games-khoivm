interface GlyphProps {
  size: number;
  bg?: string;
  accent?: string;
}

export function JoystickGlyph({
  size,
  bg = "#07111f",
  accent = "#ffd84d",
}: GlyphProps) {
  const knobD = size * 0.36;
  const stickW = size * 0.14;
  const stickH = size * 0.26;
  const baseW = size * 0.64;
  const baseH = size * 0.16;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: knobD,
            height: knobD,
            borderRadius: "50%",
            background: accent,
          }}
        />
        <div style={{ width: stickW, height: stickH, background: accent }} />
        <div
          style={{
            width: baseW,
            height: baseH,
            background: accent,
            borderRadius: baseH * 0.4,
          }}
        />
      </div>
    </div>
  );
}

export function PacmanGlyph({
  size,
  bg = "#07111f",
  accent = "#ffd84d",
}: GlyphProps) {
  const radius = size / 2 - size * 0.12;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: `${radius}px solid ${accent}`,
          borderBottom: `${radius}px solid ${accent}`,
          borderLeft: `${radius}px solid ${accent}`,
          borderRight: `${radius}px solid transparent`,
          borderRadius: `${radius}px`,
        }}
      />
    </div>
  );
}
