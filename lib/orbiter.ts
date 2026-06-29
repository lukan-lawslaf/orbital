export type IssData = {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  live: boolean;
};

export type CrewData = { count: number; people: { name: string; craft: string }[]; live: boolean };

export type OrbiterData = {
  generatedAt: string;
  sources: Record<string, boolean>;
  iss: IssData;
  crew: CrewData;
  asteroids: { name: string; distanceLunar: number; diameterMeters: number; hazardous: boolean; velocityKph: number }[];
  earthquakes: { id: string; place: string; magnitude: number; time: string; longitude: number; latitude: number; depthKm: number; url: string }[];
  weather: { temperature: number | null; windSpeed: number | null; code: number | null; location: string };
  launches: { id: string; name: string; agency: string; status: string; net: string; location: string; image: string | null; webcast: string | null }[];
  apod: { title: string; date: string; explanation: string; url: string; mediaType: string; copyright: string | null } | null;
  mars: { id: number; image: string; rover: string; camera: string; earthDate: string; sol: number } | null;
  spaceWeather: { type: string; id: string; startTime: string; note: string; link: string }[];
};

type FetchResult<T> = { data: T | null; ok: boolean };

async function json<T>(url: string, revalidate: number): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(9000),
      headers: { Accept: "application/json", "User-Agent": "ORBITER/1.0" },
    });
    if (!response.ok) return { data: null, ok: false };
    return { data: await response.json(), ok: true };
  } catch { return { data: null, ok: false }; }
}

const FALLBACK_ISS: IssData = {
  latitude: 18.24, longitude: -48.67, altitude: 421, velocity: 27580, visibility: "unknown", live: false,
};

// Live ISS telemetry. wheretheiss.at returns real altitude + velocity; open-notify is the fallback.
export async function collectIss(): Promise<IssData> {
  const primary = await json<any>("https://api.wheretheiss.at/v1/satellites/25544", 4);
  if (primary.ok && primary.data) {
    return {
      latitude: Number(primary.data.latitude),
      longitude: Number(primary.data.longitude),
      altitude: Math.round(Number(primary.data.altitude)),
      velocity: Math.round(Number(primary.data.velocity)),
      visibility: primary.data.visibility || "unknown",
      live: true,
    };
  }
  const backup = await json<any>(process.env.ISS_POSITION_URL || "http://api.open-notify.org/iss-now.json", 4);
  const position = backup.data?.iss_position;
  if (backup.ok && position) {
    return { ...FALLBACK_ISS, latitude: Number(position.latitude), longitude: Number(position.longitude), live: true };
  }
  return FALLBACK_ISS;
}

export async function collectCrew(): Promise<CrewData> {
  const crewR = await json<any>(process.env.PEOPLE_IN_SPACE_URL || "http://api.open-notify.org/astros.json", 1800);
  return {
    count: crewR.data?.number || crewR.data?.people?.length || 0,
    people: crewR.data?.people || [],
    live: crewR.ok,
  };
}

// NASA's mars-photos service is frequently empty for a given rover (or briefly down).
// Try Perseverance first, then fall back to Curiosity so an image shows when either has one.
async function collectMars(marsBase: string, key: string) {
  for (const rover of ["perseverance", "curiosity"]) {
    const r = await json<any>(`${marsBase}/rovers/${rover}/latest_photos?api_key=${key}`, 3600);
    const photo = r.data?.latest_photos?.[0];
    if (r.ok && photo) {
      return { ok: true, photo };
    }
  }
  return { ok: false, photo: null as any };
}

export async function collectOrbiterData(): Promise<OrbiterData> {
  const key = process.env.NASA_API_KEY || "DEMO_KEY";
  const nasa = {
    apod: process.env.NASA_APOD_URL || "https://api.nasa.gov/planetary/apod",
    mars: process.env.NASA_MARS_URL || "https://api.nasa.gov/mars-photos/api/v1",
    neo: process.env.NASA_NEO_URL || "https://api.nasa.gov/neo/rest/v1",
    donki: process.env.NASA_DONKI_URL || "https://api.nasa.gov/DONKI",
  };
  const today = new Date();
  const start = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const end = today.toISOString().slice(0, 10);

  const [iss, crew, neoR, quakeR, launchR, apodR, marsR, flareR, cmeR] = await Promise.all([
    collectIss(),
    collectCrew(),
    json<any>(`${nasa.neo}/feed?start_date=${end}&end_date=${end}&api_key=${key}`, 1800),
    json<any>(`${process.env.USGS_BASE_URL || "https://earthquake.usgs.gov/fdsnws/event/1/query"}?format=geojson&orderby=time&limit=20&minmagnitude=2.5`, 120),
    json<any>(`${process.env.LAUNCH_LIBRARY_URL || "https://ll.thespacedevs.com/2.2.0"}/launch/upcoming/?limit=6&ordering=net`, 3600),
    json<any>(`${nasa.apod}?api_key=${key}`, 3600),
    collectMars(nasa.mars, key),
    json<any[]>(`${nasa.donki}/FLR?startDate=${start}&endDate=${end}&api_key=${key}`, 1800),
    json<any[]>(`${nasa.donki}/CME?startDate=${start}&endDate=${end}&api_key=${key}`, 1800),
  ]);

  const quakeFeatures = quakeR.data?.features || [];
  const earthquakes = quakeFeatures.map((item: any) => ({
    id: item.id, place: item.properties.place, magnitude: item.properties.mag,
    time: new Date(item.properties.time).toISOString(), longitude: item.geometry.coordinates[0],
    latitude: item.geometry.coordinates[1], depthKm: item.geometry.coordinates[2], url: item.properties.url,
  }));
  const firstQuake = earthquakes[0];
  const weatherR = firstQuake
    ? await json<any>(`${process.env.OPEN_METEO_BASE_URL || "https://api.open-meteo.com/v1"}/forecast?latitude=${firstQuake.latitude}&longitude=${firstQuake.longitude}&current=temperature_2m,wind_speed_10m,weather_code`, 600)
    : { data: null, ok: false };

  const neoToday = neoR.data?.near_earth_objects?.[end] || [];
  const asteroids = neoToday.map((item: any) => {
    const approach = item.close_approach_data?.[0] || {};
    return { name: item.name, distanceLunar: Number(approach.miss_distance?.lunar || 0), diameterMeters: Math.round(item.estimated_diameter?.meters?.estimated_diameter_max || 0), hazardous: Boolean(item.is_potentially_hazardous_asteroid), velocityKph: Math.round(Number(approach.relative_velocity?.kilometers_per_hour || 0)) };
  }).sort((a: any, b: any) => a.distanceLunar - b.distanceLunar);

  const launchItems = launchR.data?.results || [];
  const launches = launchItems.map((item: any) => ({
    id: item.id, name: item.name, agency: item.launch_service_provider?.name || "Unknown agency",
    status: item.status?.name || "Scheduled", net: item.net, location: item.pad?.location?.name || item.pad?.name || "TBD",
    image: item.image?.image_url || item.image || null, webcast: item.vidURLs?.[0]?.url || null,
  }));
  const marsPhoto = marsR.photo;
  const flares = (flareR.data || []).slice(-4).map((item: any) => ({ type: `Solar flare ${item.classType || ""}`.trim(), id: item.flrID, startTime: item.beginTime, note: item.sourceLocation || "Solar activity detected", link: item.link }));
  const cmes = (cmeR.data || []).slice(-3).map((item: any) => ({ type: "Coronal mass ejection", id: item.activityID, startTime: item.startTime, note: item.note || "CME observed", link: item.link }));

  return {
    generatedAt: new Date().toISOString(),
    sources: { iss: iss.live, crew: crew.live, neo: neoR.ok, earthquakes: quakeR.ok, weather: weatherR.ok, launches: launchR.ok, apod: apodR.ok, mars: marsR.ok, spaceWeather: flareR.ok || cmeR.ok },
    iss,
    crew,
    asteroids,
    earthquakes,
    weather: { temperature: weatherR.data?.current?.temperature_2m ?? null, windSpeed: weatherR.data?.current?.wind_speed_10m ?? null, code: weatherR.data?.current?.weather_code ?? null, location: firstQuake?.place || "Latest seismic event" },
    launches,
    apod: apodR.data ? { title: apodR.data.title, date: apodR.data.date, explanation: apodR.data.explanation, url: apodR.data.url || apodR.data.hdurl, mediaType: apodR.data.media_type, copyright: apodR.data.copyright || null } : null,
    mars: marsPhoto ? { id: marsPhoto.id, image: marsPhoto.img_src, rover: marsPhoto.rover?.name, camera: marsPhoto.camera?.full_name, earthDate: marsPhoto.earth_date, sol: marsPhoto.sol } : null,
    spaceWeather: [...flares, ...cmes].sort((a, b) => +new Date(b.startTime) - +new Date(a.startTime)),
  };
}
