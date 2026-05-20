"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  IoChevronBack,
  IoChevronForward,
  IoColorPaletteOutline,
  IoCreateOutline,
  IoFlagOutline,
  IoLanguageOutline,
  IoPeopleOutline,
  IoPhonePortraitOutline,
} from "react-icons/io5";
import type { IconType } from "react-icons";
import { useT } from "@/lib/i18n";
import { T } from "@/lib/tokens";

interface Feature {
  Icon: IconType;
  color: string;
  titleKey: string;
  bodyKey: string;
}

const ITEMS: Feature[] = [
  { Icon: IoPeopleOutline, color: T.primary, titleKey: "features.players.title", bodyKey: "features.players.body" },
  { Icon: IoPhonePortraitOutline, color: T.coral, titleKey: "features.onePhone.title", bodyKey: "features.onePhone.body" },
  { Icon: IoColorPaletteOutline, color: T.mint, titleKey: "features.spectrums.title", bodyKey: "features.spectrums.body" },
  { Icon: IoLanguageOutline, color: T.lavender, titleKey: "features.languages.title", bodyKey: "features.languages.body" },
  { Icon: IoCreateOutline, color: T.sky, titleKey: "features.custom.title", bodyKey: "features.custom.body" },
  { Icon: IoFlagOutline, color: T.yellow, titleKey: "features.offline.title", bodyKey: "features.offline.body" },
];

export function FeaturesCarousel() {
  const t = useT();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  function go(idx: number) {
    const i = ((idx % ITEMS.length) + ITEMS.length) % ITEMS.length;
    setActive(i);
  }

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % ITEMS.length), 4500);
    return () => clearInterval(id);
  }, [paused]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") go(active - 1);
      if (e.key === "ArrowRight") go(active + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ padding: "60px 0 80px", position: "relative", zIndex: 2 }}
    >
      <div className="sintonia-container">
        <div className="flex flex-col items-center text-center" style={{ marginBottom: 40 }}>
          <span className="section-eyebrow">{t("features.eyebrow")}</span>
          <h2 className="section-title">
            {t("features.title.before")}{" "}
            <em
              style={{
                fontStyle: "normal",
                background: "linear-gradient(90deg, #F8E71C, #F5A623, #FF6B6B, #E84393)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("features.title.highlight")}
            </em>{" "}
            {t("features.title.after")}
          </h2>
          <p className="section-subtitle">{t("features.subtitle")}</p>
        </div>

        {/* Carousel */}
        <div className="relative" style={{ height: 380 }}>
          {/* Cards stack */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{ transform: "translate(-50%, -50%)", width: "100%", maxWidth: 1080, height: "100%" }}
          >
            {ITEMS.map((item, i) => {
              const offset = i - active;
              const wrapped =
                offset > ITEMS.length / 2
                  ? offset - ITEMS.length
                  : offset < -ITEMS.length / 2
                    ? offset + ITEMS.length
                    : offset;
              return (
                <CarouselCard
                  key={i}
                  item={item}
                  offset={wrapped}
                  onClick={() => go(i)}
                  t={t}
                />
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center mt-8 gap-5">
          <ArrowBtn dir="l" onClick={() => go(active - 1)} />

          <div className="flex items-center gap-2">
            {ITEMS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`ir para ${i + 1}`}
                className="feat-dot"
                style={{
                  width: i === active ? 30 : 10,
                  height: 10,
                  borderRadius: 999,
                  background:
                    i === active ? ITEMS[active].color : "rgba(139,157,195,0.28)",
                  boxShadow:
                    i === active ? `0 0 12px ${ITEMS[active].color}88` : "none",
                }}
              />
            ))}
          </div>

          <ArrowBtn dir="r" onClick={() => go(active + 1)} />
        </div>

        {/* Counter */}
        <div
          className="text-center mt-4"
          style={{
            color: T.textMuted,
            fontFamily: T.fontBody,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "#fff" }}>{String(active + 1).padStart(2, "0")}</span>
          <span style={{ margin: "0 8px", opacity: 0.4 }}>/</span>
          <span>{String(ITEMS.length).padStart(2, "0")}</span>
        </div>
      </div>
    </section>
  );
}

function CarouselCard({
  item,
  offset,
  onClick,
  t,
}: {
  item: Feature;
  offset: number;
  onClick: () => void;
  t: (key: string) => string;
}) {
  const { Icon } = item;
  const isActive = offset === 0;
  const absOffset = Math.abs(offset);

  // Hide cards more than 2 positions away
  const hidden = absOffset > 2;

  // Position cards horizontally
  const x = offset * 240;
  const scale = isActive ? 1 : 1 - absOffset * 0.12;
  const opacity = hidden ? 0 : isActive ? 1 : 0.5 - absOffset * 0.15;
  const zIndex = 10 - absOffset;
  const rotateY = offset * -8;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={{
        x,
        scale,
        opacity,
        rotateY,
        zIndex,
      }}
      transition={{ type: "spring", stiffness: 200, damping: 28 }}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(420px, 86vw)",
        height: "min(360px, 60vh)",
        padding: "32px 28px 30px",
        borderRadius: 24,
        background:
          "linear-gradient(180deg, rgba(36,51,84,0.92) 0%, rgba(20,30,55,0.96) 100%)",
        border: `1px solid ${item.color}33`,
        boxShadow: isActive
          ? `0 30px 60px -20px rgba(0,0,0,0.6), 0 0 80px ${item.color}22, inset 0 1px 0 rgba(255,255,255,0.06)`
          : "0 20px 40px -20px rgba(0,0,0,0.5)",
        cursor: isActive ? "default" : "pointer",
        pointerEvents: hidden ? "none" : "auto",
        textAlign: "left",
        display: "flex",
        flexDirection: "column",
        appearance: "none",
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
    >
      {/* Color glow blob */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${item.color}22, transparent 70%)`,
          filter: "blur(20px)",
          opacity: isActive ? 1 : 0.5,
        }}
      />

      {/* Icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: `${item.color}1F`,
          border: `1.5px solid ${item.color}55`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: item.color,
          marginBottom: 24,
          boxShadow: `inset 0 0 16px ${item.color}11`,
        }}
      >
        <Icon size={32} />
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontWeight: 800,
          fontSize: 28,
          color: "#fff",
          marginBottom: 12,
          lineHeight: 1.1,
          letterSpacing: -0.5,
        }}
      >
        {t(item.titleKey)}
      </div>

      {/* Body */}
      <div
        style={{
          color: T.textMuted,
          fontSize: 15,
          lineHeight: 1.55,
        }}
      >
        {t(item.bodyKey)}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div
          className="flex items-center gap-2 mt-auto"
          style={{
            paddingTop: 20,
            color: item.color,
            fontFamily: T.fontBody,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1.5,
            textTransform: "uppercase",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: item.color,
              boxShadow: `0 0 8px ${item.color}`,
            }}
          />
          {t("features.active")}
        </div>
      )}
    </motion.button>
  );
}

function ArrowBtn({ dir, onClick }: { dir: "l" | "r"; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "l" ? "anterior" : "próximo"}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        width: 48,
        height: 48,
        borderRadius: 999,
        background: "rgba(36,51,84,0.85)",
        border: "1px solid rgba(139,157,195,0.22)",
        color: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "transform 120ms cubic-bezier(.2,.7,.2,1)",
        boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        padding: 0,
        appearance: "none",
        transform: pressed ? "scale(0.92)" : "scale(1)",
      }}
    >
      {dir === "l" ? (
        <IoChevronBack size={22} color="#fff" />
      ) : (
        <IoChevronForward size={22} color="#fff" />
      )}
    </button>
  );
}
