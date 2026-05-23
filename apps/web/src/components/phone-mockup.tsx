"use client";

interface Props {
  width?: number;
}

// Titanium iPhone 16 Pro mockup. Screen plays a muted/looped recording
// of the real app (apps/web/public/hero/phone-loop.mp4) so the visuals
// are 100% authentic instead of an HTML recreation.
export function PhoneMockup({ width = 260 }: Props) {
  const ratio = 19.5 / 9.5;
  const height = Math.round(width * ratio);

  return (
    <div
      className="relative"
      style={{ width, height, transformStyle: "preserve-3d" }}
    >
      {/* === 3D BODY: back / side / front layers stacked on Z axis === */}
      {/* Each translateZ slice reveals the case's side wall when the phone
          tilts (via the parent's rotateX/rotateY). Combined they create
          actual depth instead of a flat painted shape. */}

      {/* Back face — pushed deepest */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 48,
          background:
            "linear-gradient(135deg, #14171f 0%, #2a3140 50%, #14171f 100%)",
          transform: "translateZ(-14px)",
        }}
      />
      {/* Mid wall slices — every 2px of Z creates a visible band when tilted */}
      {[-12, -10, -8, -6, -4, -2].map((z) => (
        <div
          key={z}
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 48,
            background:
              "linear-gradient(135deg, #1f2430 0%, #3d4452 40%, #1a1d24 70%, #34394a 100%)",
            transform: `translateZ(${z}px)`,
          }}
        />
      ))}

      {/* Front titanium face */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 48,
          background:
            "linear-gradient(135deg, #2a2f3a 0%, #5a6273 18%, #1a1d24 38%, #4a5260 58%, #1d2030 78%, #3a4250 100%)",
          boxShadow: [
            "0 40px 80px -20px rgba(0,0,0,0.75)",
            "0 25px 50px -10px rgba(0,0,0,0.55)",
            "inset 0 2px 3px rgba(255,255,255,0.18)",
            "inset 0 -2px 3px rgba(0,0,0,0.5)",
            "inset 0 0 0 1px rgba(255,255,255,0.05)",
          ].join(","),
        }}
      />

      {/* Side buttons */}
      <SideButton side="left" top={140} length={60} />
      <SideButton side="left" top={220} length={40} />
      <SideButton side="left" top={280} length={40} />
      <SideButton side="right" top={200} length={80} />

      {/* Inner glossy bezel */}
      <div
        className="absolute"
        style={{
          inset: 6,
          borderRadius: 42,
          background:
            "radial-gradient(ellipse at top, rgba(255,255,255,0.15), transparent 60%), #060912",
        }}
      />

      {/* Screen — video fills entire inner screen area */}
      <div
        className="absolute overflow-hidden"
        style={{
          inset: 10,
          borderRadius: 38,
          background: "#0a172b",
        }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/hero/phone-poster.jpg"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        >
          <source src="/hero/phone-loop.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Glass — diagonal sheen across the screen */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 10,
          borderRadius: 38,
          background:
            "linear-gradient(125deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 18%, transparent 38%, transparent 62%, rgba(255,255,255,0.04) 82%, rgba(255,255,255,0.12) 100%)",
          mixBlendMode: "screen",
          zIndex: 10,
        }}
      />

      {/* Glass — inner top-edge highlight (light kissing the curved glass) */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 10,
          borderRadius: 38,
          background:
            "radial-gradient(120% 30% at 50% 0%, rgba(255,255,255,0.18), transparent 70%)",
          mixBlendMode: "screen",
          zIndex: 10,
        }}
      />

      {/* Glass — bezel inner highlight */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: 10,
          borderRadius: 38,
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 1px rgba(255,255,255,0.22), inset 0 -2px 6px rgba(0,0,0,0.35)",
          zIndex: 11,
        }}
      />
    </div>
  );
}

function SideButton({
  side,
  top,
  length,
}: {
  side: "left" | "right";
  top: number;
  length: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        [side === "left" ? "left" : "right"]: -3,
        top,
        width: 3,
        height: length,
        borderRadius: side === "left" ? "0 2px 2px 0" : "2px 0 0 2px",
        background:
          side === "left"
            ? "linear-gradient(to right, #1a1d24 30%, #4a5260 70%, #2a2f3a)"
            : "linear-gradient(to left, #1a1d24 30%, #4a5260 70%, #2a2f3a)",
      }}
    />
  );
}
