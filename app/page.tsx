"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { OrbiterData } from "@/lib/orbiter";
import Loader from "./components/Loader";
import {
  ArrowDown, ArrowRight, BookOpen, Bot, CircleDot, CloudSun, Earth,
  ExternalLink, Globe2, Image as ImageIcon, Menu, Orbit, Radio, RefreshCw, Rocket,
  Satellite, Sparkles, Telescope, Users, Waves, Wand2, Zap,
} from "lucide-react";

const GlobeView = dynamic(() => import("./components/GlobeView"), {
  ssr: false,
  loading: () => <div className="globe-loading"><RefreshCw className="spin" size={20} /></div>,
});

const fallback: OrbiterData = {
  generatedAt: "", sources: {},
  iss: { latitude: 18.24, longitude: -48.67, altitude: 421, velocity: 27580, visibility: "unknown", live: false },
  crew: { count: 0, people: [], live: false }, asteroids: [], earthquakes: [],
  weather: { temperature: null, windSpeed: null, code: null, location: "Latest seismic event" },
  launches: [], apod: null, mars: null, spaceWeather: [],
};

function Mark({ large = false }: { large?: boolean }) {
  return <span className={`orbiter-mark ${large ? "mark-large" : ""}`}><span /><i /></span>;
}
function GlassIcon({ children }: { children: React.ReactNode }) { return <span className="icon-disc">{children}</span>; }
function SourceState({ live }: { live?: boolean }) { return <span className={`source-state ${live ? "source-live" : ""}`}><i />{live ? "LIVE" : "FALLBACK"}</span>; }
function formatDate(value?: string) { return value ? new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Awaiting data"; }

export default function Home() {
  const [data, setData] = useState<OrbiterData>(fallback);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<Date | null>(null);
  const [briefing, setBriefing] = useState("Generate a live situation report from every connected planetary feed.");
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [analysisLoading, setAnalysisLoading] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState<Record<string, boolean>>({});

  // Full aggregation (NASA, USGS, launches, DONKI…). Heavy + rate-limited, so polled slowly.
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      if (!response.ok) throw new Error("Feed unavailable");
      setData(await response.json());
      setImgFailed({});
    } catch { /* keep last good data */ }
    finally { setLoading(false); }
  }, []);

  // Lightweight ISS + crew telemetry, polled fast for live motion on the globe.
  const loadIss = useCallback(async () => {
    try {
      const response = await fetch("/api/iss", { cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      setData((current) => ({ ...current, iss: result.iss, crew: result.crew }));
    } catch { /* ignore transient errors */ }
  }, []);

  useEffect(() => {
    load();
    loadIss();
    setNow(new Date());
    const issFeed = setInterval(loadIss, Number(process.env.NEXT_PUBLIC_REFRESH_INTERVAL || 5000));
    const fullFeed = setInterval(load, 60000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(issFeed); clearInterval(fullFeed); clearInterval(clock); };
  }, [load, loadIss]);

  async function generateBriefing() {
    setBriefingLoading(true);
    try {
      const response = await fetch("/api/briefing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const result = await response.json();
      setBriefing(result.briefing || result.error || "Briefing unavailable.");
    } catch { setBriefing("The AI briefing service could not be reached."); }
    finally { setBriefingLoading(false); }
  }

  async function analyze(target: "mars" | "apod") {
    setAnalysisLoading(target);
    const image = target === "apod" ? data.apod?.url : data.mars?.image;
    try {
      const response = await fetch("/api/vision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target, image }) });
      const result = await response.json();
      setAnalysis((current) => ({ ...current, [target]: result.analysis || result.error || "Analysis unavailable." }));
    } catch { setAnalysis((current) => ({ ...current, [target]: "Vision service could not be reached." })); }
    finally { setAnalysisLoading(null); }
  }

  const activeSources = useMemo(() => Object.values(data.sources).filter(Boolean).length, [data.sources]);
  const nearest = data.asteroids[0];
  const quake = data.earthquakes[0];
  const launch = data.launches[0];
  const utc = now ? now.toUTCString().slice(17, 25) : "--:--:--";

  return <main className="site">
    <Loader done={!loading} />
    <section className="viewport">
      <div className="space-scene" aria-hidden="true"><div className="stars stars-one" /><div className="stars stars-two" /><div className="planet"><span className="planet-shade" /><span className="planet-glow" /></div><div className="trajectory trajectory-one" /><div className="trajectory trajectory-two" /></div>
      <div className="grain" aria-hidden="true" />
      <div className="layout">
        <section className="hero-panel liquid-glass-strong">
          <nav className="top-nav"><a className="wordmark" href="#"><Mark /><span>orbiter</span></a><a className="glass-pill menu-button" href="#command">Explore <Menu size={17} strokeWidth={1.7} /></a></nav>
          <div className="hero-copy"><Mark large /><p className="overline"><span className={`status-dot ${activeSources ? "live" : ""}`} /> {activeSources}/9 intelligence networks · {utc} UTC</p><div className="headline-wrap"><span className="cursive-accent">in real time</span><h1>Observe the world.<br /><em>Understand beyond.</em></h1></div><p className="intro">Live Earth and space intelligence, fused from scientific networks and translated by AI into one coherent planetary picture.</p><div className="hero-actions"><a href="#command" className="primary-action">Enter command center <GlassIcon><ArrowDown size={15} /></GlassIcon></a><button className="round-action" onClick={generateBriefing} aria-label="Generate briefing"><Sparkles size={17} /></button></div><div className="topic-pills"><span className="glass-pill"><Satellite size={13} /> Live orbit</span><span className="glass-pill"><Earth size={13} /> Earth systems</span><span className="glass-pill"><Sparkles size={13} /> AI briefing</span></div></div>
          <div className="hero-bottom"><p className="section-label">THE MISSION</p><blockquote>“To make a restless planet <em>legible.</em>”</blockquote><div className="signature"><span /> ORBITER / LIVE SYSTEM <span /></div></div>
        </section>
        <aside className="intel-panel">
          <div className="utility-row"><div className="socials liquid-glass"><span><Radio size={14} /></span><b>DATA FUSION ACTIVE</b></div><button className="account liquid-glass" onClick={load}><RefreshCw className={loading ? "spin" : ""} size={14} /> Refresh feeds</button></div>
          <div className="live-card liquid-glass"><div className="live-card-top"><span><Satellite size={13} /> Live orbital telemetry</span><SourceState live={data.iss.live} /></div><strong>{data.iss.latitude.toFixed(2)}° <i>/</i> {data.iss.longitude.toFixed(2)}°</strong><div className="live-stats"><div><small>ALTITUDE</small><b>{data.iss.altitude.toLocaleString()}<u>km</u></b></div><div><small>VELOCITY</small><b>{Math.round(data.iss.velocity / 1000)}<u>k km/h</u></b></div><div><small>CREW</small><b>{data.crew.count || "—"}<u>aboard orbit</u></b></div></div><p>The International Space Station is {data.iss.visibility === "daylight" ? "tracking through daylight" : data.iss.visibility === "eclipsed" ? "passing through Earth's shadow" : "in orbit"}, completing one revolution roughly every 92 minutes.</p></div>
          <div className="intelligence liquid-glass"><div className="intel-heading"><div><p className="section-label">NOW / GLOBAL OVERVIEW</p><h2>Planetary pulse</h2></div><span className="pulse-state"><i /> {loading ? "SYNCING" : `${activeSources} LIVE`}</span></div><div className="feature-grid"><article className="feature-card liquid-glass"><div className="card-icon"><Orbit size={20} /></div><p>Near-Earth watch</p><strong>{nearest ? `${nearest.distanceLunar.toFixed(2)} LD` : "No feed"}</strong><small>{nearest?.name?.replace(/[()]/g, "") || "NASA NeoWs awaiting response"}</small></article><article className="feature-card liquid-glass"><div className="card-icon"><Waves size={20} /></div><p>Seismic activity</p><strong>{quake ? `M ${quake.magnitude.toFixed(1)}` : "No feed"}</strong><small>{quake?.place || "USGS awaiting response"}</small></article></div><article className="briefing-card liquid-glass-strong"><div className="briefing-visual"><div className="mini-earth"><span /></div></div><div className="briefing-copy"><p className="section-label"><BookOpen size={12} /> NVIDIA NIM BRIEFING</p><h3>What the planet is telling us</h3><p>{briefing}</p></div><button className="plus-button" onClick={generateBriefing} disabled={briefingLoading} aria-label="Generate briefing">{briefingLoading ? <RefreshCw className="spin" size={17} /> : <ArrowRight size={18} />}</button></article><div className="launch-strip"><span><Rocket size={14} /> Next launch</span><strong>{launch?.name || "Awaiting Launch Library"}</strong><small>{formatDate(launch?.net)}</small></div></div>
        </aside>
      </div>
    </section>

    <section className="command" id="command">
      <header className="command-header"><div><p className="section-label">LIVE OPERATIONS / {formatDate(data.generatedAt)}</p><div className="title-wrap"><span className="cursive-accent small">right now</span><h2>Command center</h2></div><p>Nine networks. One planetary picture.</p></div><div className="source-count liquid-glass"><span>{activeSources}</span><small>LIVE<br />SOURCES</small></div></header>
      <div className="module-grid">
        <article className="module module-wide module-briefing liquid-glass-strong"><div className="module-head"><span><Bot size={17} /> AI planetary briefing</span><SourceState live /></div><p className="briefing-eyebrow">NVIDIA NIM · synthesized from every live feed</p><p className="briefing-text">{briefing}</p><div className="briefing-foot"><div className="briefing-chips"><span><Waves size={11} /> Seismic</span><span><Orbit size={11} /> Asteroids</span><span><Zap size={11} /> Space weather</span><span><Satellite size={11} /> ISS &amp; crew</span><span><Rocket size={11} /> Launches</span></div><button className="module-action accent" onClick={generateBriefing} disabled={briefingLoading}>{briefingLoading ? <RefreshCw className="spin" size={15} /> : <Sparkles size={15} />} {briefingLoading ? "Analyzing all feeds…" : "Generate live briefing"}</button></div></article>

        <article className="module module-globe module-wide liquid-glass-strong"><div className="module-head"><span><Globe2 size={17} /> Live orbital map</span><SourceState live={data.iss.live} /></div><div className="globe-stage"><GlobeView iss={data.iss} earthquakes={data.earthquakes} autoRotate={process.env.NEXT_PUBLIC_GLOBE_AUTO_ROTATE !== "false"} /></div><div className="globe-readout"><div><small>ISS POSITION</small><b>{data.iss.latitude.toFixed(2)}°, {data.iss.longitude.toFixed(2)}°</b></div><div><small>ALTITUDE</small><b>{data.iss.altitude.toLocaleString()} km</b></div><div><small>VELOCITY</small><b>{data.iss.velocity.toLocaleString()} km/h</b></div><div><small>SEISMIC PLOTS</small><b>{data.earthquakes.length}</b></div></div></article>

        <article className="module liquid-glass"><div className="module-head"><span><Satellite size={17} /> ISS and crew</span><SourceState live={data.iss.live || data.crew.live} /></div><div className="big-stat">{data.crew.count || "—"}<small>people in space</small></div><div className="telemetry"><span>{data.iss.latitude.toFixed(2)}° lat</span><span>{data.iss.longitude.toFixed(2)}° lon</span><span>{data.iss.altitude} km</span></div><div className="crew-list">{data.crew.people.slice(0, 4).map((person) => <span key={person.name}><Users size={11} /> {person.name} · {person.craft}</span>)}</div></article>

        <article className="module liquid-glass"><div className="module-head"><span><Orbit size={17} /> Asteroid watch</span><SourceState live={data.sources.neo} /></div><div className="scroll-list">{data.asteroids.slice(0, 5).map((item) => <div className="data-row" key={item.name}><span className={item.hazardous ? "hazard-dot" : "quiet-dot"} /><b>{item.name.replace(/[()]/g, "")}</b><small>{item.distanceLunar.toFixed(2)} LD</small><small>{item.diameterMeters} m</small></div>)}{!data.asteroids.length && <p className="empty">NASA NeoWs did not return an object list.</p>}</div></article>

        <article className="module liquid-glass"><div className="module-head"><span><Waves size={17} /> Earth activity</span><SourceState live={data.sources.earthquakes} /></div><div className="scroll-list">{data.earthquakes.slice(0, 5).map((item) => <a className="data-row quake-row" href={item.url} target="_blank" rel="noreferrer" key={item.id}><b>M {item.magnitude.toFixed(1)}</b><span>{item.place}</span><small>{formatDate(item.time)}</small></a>)}</div></article>

        <article className="module liquid-glass"><div className="module-head"><span><CloudSun size={17} /> Event weather</span><SourceState live={data.sources.weather} /></div><div className="weather-reading"><strong>{data.weather.temperature ?? "—"}°</strong><div><b>Near latest earthquake</b><p>{data.weather.location}</p></div></div><div className="telemetry"><span>Wind {data.weather.windSpeed ?? "—"} km/h</span><span>WMO {data.weather.code ?? "—"}</span></div></article>

        <article className="module module-wide liquid-glass"><div className="module-head"><span><Rocket size={17} /> Global launch schedule</span><SourceState live={data.sources.launches} /></div><div className="launch-list">{data.launches.slice(0, 5).map((item) => <div className="launch-row" key={item.id}><span className="launch-index">{String(data.launches.indexOf(item) + 1).padStart(2, "0")}</span><div><b>{item.name}</b><small>{item.agency} · {item.location}</small></div><time>{formatDate(item.net)}</time><span>{item.status}</span></div>)}</div></article>

        <article className={`module image-module liquid-glass ${data.mars?.image && !imgFailed.mars ? "has-image" : ""}`}>{data.mars?.image && !imgFailed.mars ? <><img className="module-img" src={data.mars.image} alt="Latest Mars rover image" onError={() => setImgFailed((s) => ({ ...s, mars: true }))} /><div className="module-img-scrim" /></> : <div className="image-placeholder"><ImageIcon size={30} /><span>Awaiting rover downlink</span></div>}<div className="module-head"><span><ImageIcon size={17} /> Mars intelligence</span><SourceState live={data.sources.mars} /></div><div className="image-copy"><p className="section-label">{data.mars ? `${data.mars.rover} · SOL ${data.mars.sol}` : "NASA MARS ROVER"}</p><h3>{data.mars?.camera || "Latest surface image"}</h3><p>{analysis.mars || (data.mars ? `Captured ${data.mars.earthDate}. Run Kimi Vision for a geological reading.` : "The Mars image feed is currently unavailable.")}</p><button className="module-action" onClick={() => analyze("mars")} disabled={!data.mars || analysisLoading === "mars"}><Wand2 size={14} /> {analysisLoading === "mars" ? "Analyzing…" : "Analyze terrain"}</button></div></article>

        <article className={`module image-module liquid-glass ${data.apod?.url && data.apod.mediaType === "image" && !imgFailed.apod ? "has-image" : ""}`}>{data.apod?.url && data.apod.mediaType === "image" && !imgFailed.apod ? <><img className="module-img" src={data.apod.url} alt={data.apod.title || "Astronomy picture of the day"} onError={() => setImgFailed((s) => ({ ...s, apod: true }))} /><div className="module-img-scrim" /></> : <div className="image-placeholder"><Telescope size={30} /><span>Awaiting telescope feed</span></div>}<div className="module-head"><span><Telescope size={17} /> Astronomy picture</span><SourceState live={data.sources.apod} /></div><div className="image-copy"><p className="section-label">NASA APOD · {data.apod?.date}</p><h3>{data.apod?.title || "Astronomy picture of the day"}</h3><p>{analysis.apod || data.apod?.explanation || "APOD is currently unavailable."}</p><button className="module-action" onClick={() => analyze("apod")} disabled={!data.apod || analysisLoading === "apod"}><Wand2 size={14} /> {analysisLoading === "apod" ? "Analyzing…" : "Analyze image"}</button></div></article>

        <article className="module module-wide liquid-glass"><div className="module-head"><span><Zap size={17} /> Space weather</span><SourceState live={data.sources.spaceWeather} /></div><div className="weather-events">{data.spaceWeather.slice(0, 6).map((event) => <a href={event.link} target="_blank" rel="noreferrer" key={event.id}><span><CircleDot size={13} /></span><div><b>{event.type}</b><small>{event.note}</small></div><time>{formatDate(event.startTime)}</time><ExternalLink size={13} /></a>)}{!data.spaceWeather.length && <p className="empty">No recent DONKI flare or CME events were returned.</p>}</div></article>
      </div>
      <footer className="command-footer"><span><Mark /> ORBITER</span><p>Data from NASA, USGS, Open-Meteo, Open Notify and The Space Devs. AI by NVIDIA NIM.</p><a href="#">Return to orbit <ArrowRight size={13} /></a></footer>
    </section>
  </main>;
}
