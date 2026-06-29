"use client";

import { useEffect, useState } from "react";

const STATUS = [
  "Linking orbital telemetry",
  "Pulling NASA + USGS feeds",
  "Triangulating the ISS",
  "Scanning near-Earth space",
  "Composing the planetary picture",
];

export default function Loader({ done }: { done: boolean }) {
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [step, setStep] = useState(0);

  // Cycle the status line while loading.
  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % STATUS.length), 1400);
    return () => clearInterval(t);
  }, []);

  // When the first feed resolves, play a short exit, then unmount.
  useEffect(() => {
    if (!done) return;
    const a = setTimeout(() => setLeaving(true), 200);
    const b = setTimeout(() => setHidden(true), 1100);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [done]);

  if (hidden) return null;

  return (
    <div className={`loader ${leaving ? "loader-out" : ""}`} aria-hidden={leaving}>
      <video className="loader-video" autoPlay loop muted playsInline preload="auto" poster="">
        <source src="/loader.mp4" type="video/mp4" />
      </video>
      <div className="loader-scrim" />
      <div className="loader-grain" />
      <div className="loader-content">
        <p className="loader-eyebrow">Earth &amp; space intelligence</p>
        <h1 className="loader-word">ORBITER<em>booting up</em></h1>
        <div className="loader-bar"><span /></div>
        <p className="loader-status">{STATUS[step]}<i>…</i></p>
      </div>
    </div>
  );
}
