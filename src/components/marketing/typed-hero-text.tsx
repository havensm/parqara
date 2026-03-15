"use client";

import { useEffect, useEffectEvent, useState } from "react";

const STATIC_PREFIX = "Plan";

const heroSuffixes = [
  " trips.",
  " weekends.",
  " nights out.",
  " family adventures.",
] as const;

const TYPE_DELAY_MS = 108;
const DELETE_DELAY_MS = 54;
const HOLD_DELAY_MS = 1900;
const NEXT_PHRASE_DELAY_MS = 380;

export function TypedHeroText() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting">("typing");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const currentSuffix = heroSuffixes[phraseIndex] ?? heroSuffixes[0];
  const currentPhrase = `${STATIC_PREFIX}${currentSuffix}`;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setPrefersReducedMotion(mediaQuery.matches);
    syncPreference();
    mediaQuery.addEventListener("change", syncPreference);
    return () => mediaQuery.removeEventListener("change", syncPreference);
  }, []);

  const tick = useEffectEvent(() => {
    if (phase === "typing") {
      const nextValue = currentSuffix.slice(0, visibleText.length + 1);
      setVisibleText(nextValue);

      if (nextValue === currentSuffix) {
        setPhase("holding");
      }

      return;
    }

    if (phase === "holding") {
      setPhase("deleting");
      return;
    }

    const nextValue = currentSuffix.slice(0, Math.max(0, visibleText.length - 1));
    setVisibleText(nextValue);

    if (nextValue.length === 0) {
      setPhase("typing");
      setPhraseIndex((current) => (current + 1) % heroSuffixes.length);
    }
  });

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const delay =
      phase === "typing"
        ? TYPE_DELAY_MS
        : phase === "holding"
          ? HOLD_DELAY_MS
          : visibleText.length === 0
            ? NEXT_PHRASE_DELAY_MS
            : DELETE_DELAY_MS;

    const timeoutId = window.setTimeout(() => {
      tick();
    }, delay);

    return () => window.clearTimeout(timeoutId);
  }, [phase, prefersReducedMotion, visibleText.length]);

  return (
    <div className="mx-auto max-w-5xl text-center">
      <h1
        aria-label={prefersReducedMotion ? `${STATIC_PREFIX}${heroSuffixes[0]}` : currentPhrase}
        className="font-[family-name:var(--font-display)] text-5xl font-semibold tracking-[-0.07em] text-white sm:text-6xl lg:text-[6.4rem] lg:leading-[0.92]"
      >
        <span aria-hidden="true">{STATIC_PREFIX}</span>
        <span aria-hidden="true">{prefersReducedMotion ? heroSuffixes[0] : visibleText}</span>
        {!prefersReducedMotion ? (
          <span
            aria-hidden="true"
            className="ml-1 inline-block h-[0.9em] w-[0.08em] translate-y-[0.08em] rounded-full bg-white/88 align-baseline shadow-[0_0_24px_rgba(255,255,255,0.4)] animate-[parqara-caret_1.15s_steps(1,end)_infinite]"
          />
        ) : null}
      </h1>
    </div>
  );
}
