"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";

type Quake = { id: string; place: string; magnitude: number; latitude: number; longitude: number };
type Iss = { latitude: number; longitude: number; altitude: number };

export default function GlobeView({
  iss,
  earthquakes,
  autoRotate = true,
}: {
  iss: Iss;
  earthquakes: Quake[];
  autoRotate?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 320, height: 320 });

  // Keep the canvas sized to its container.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height: Math.max(height, 280) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Configure controls once the globe instance exists.
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const controls = g.controls() as unknown as {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
    };
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.5;
    controls.enableZoom = true;
    g.pointOfView({ lat: iss.latitude, lng: iss.longitude, altitude: 2.4 }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRotate, size.width]);

  const quakePoints = useMemo(
    () =>
      earthquakes
        .filter((q) => Number.isFinite(q.latitude) && Number.isFinite(q.longitude))
        .map((q) => ({ ...q, type: "quake" as const })),
    [earthquakes]
  );

  const issRings = useMemo(
    () => [{ lat: iss.latitude, lng: iss.longitude }],
    [iss.latitude, iss.longitude]
  );

  const issMarker = useMemo(
    () => [{ lat: iss.latitude, lng: iss.longitude, alt: 0.18 }],
    [iss.latitude, iss.longitude]
  );

  return (
    <div ref={wrapRef} className="globe-canvas">
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        atmosphereColor="#cfcfcf"
        atmosphereAltitude={0.18}
        // Earthquakes — height + colour scale with magnitude.
        pointsData={quakePoints}
        pointLat={(d: any) => d.latitude}
        pointLng={(d: any) => d.longitude}
        pointAltitude={(d: any) => Math.max(0.01, (d.magnitude || 0) * 0.035)}
        pointRadius={(d: any) => 0.15 + (d.magnitude || 0) * 0.06}
        pointColor={(d: any) => (d.magnitude >= 5 ? "#ffffff" : "rgba(255,255,255,0.55)")}
        pointLabel={(d: any) => `M ${d.magnitude?.toFixed(1)} · ${d.place}`}
        pointsMerge={false}
        pointsTransitionDuration={0}
        // ISS pulse ring at the sub-satellite point.
        ringsData={issRings}
        ringLat={(d: any) => d.lat}
        ringLng={(d: any) => d.lng}
        ringColor={() => (t: number) => `rgba(255,255,255,${1 - t})`}
        ringMaxRadius={5}
        ringPropagationSpeed={3}
        ringRepeatPeriod={900}
        // ISS marker label.
        htmlElementsData={issMarker}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlAltitude={(d: any) => d.alt}
        htmlElement={() => {
          const el = document.createElement("div");
          el.className = "iss-marker";
          el.innerHTML = `<span class="iss-dot"></span><span class="iss-tag">ISS</span>`;
          return el;
        }}
      />
    </div>
  );
}
