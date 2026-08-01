"use client";

import { useEffect, useRef, useState } from "react";
import PixelBurst from "@/components/pixel-burst";

type LineFx = "fade" | "dark-only" | "light-only";
type Line = { kind: "input" | "output"; text: string; fx?: LineFx };

const USER = "kunalbhat";
const HOST = "localhost";

/**
 * A minimal tmux-style terminal. Renders a prompt with a blinking cursor,
 * accepts typed entries, and dispatches them through a small command
 * registry. Built to grow — add cases to `run()` to support new commands.
 */
const WHOAMI = [`${USER} — chicago-based product designer.`];

const HELP = [
  "supported commands:",
  "  whoami   — print the current user",
  "  theme    — color / accessibility themes",
  "  vpn      — tunnel to a city (preset or any)",
  "  settings — view current settings",
  "  library  — stored clues",
  "  date     — show date · time (date -u = utc)",
  "  clear    — clear the screen",
  "  exit     — power down",
  "  help     — this list",
];

const BOOT_LINES = [
  "kunalbhat-os 0.1 — booting…",
  "[ ok ] mounting /dev/self",
  "[ ok ] starting display :: 1 window",
  "[ ok ] loading input handlers",
  "[ ok ] warming shell (zsh)",
  "ready.",
];

const HINT = "// a blinking prompt in the dark. try: help";

// The library: clues stored as text notes. Each line may carry an effect that
// reacts to terminal state — the puzzle mechanic. Append notes over time.
// Weather glyphs that count as "raining".
const RAIN_GLYPHS = new Set(["🌧", "🌦", "⛈"]);

// State a note can react to when deciding whether it's visible at all.
type NoteCtx = {
  theme: Theme;
  place: Place;
  weather: string | null;
  now: Date | null;
};
type NoteLine = { text: string; fx?: LineFx };
type Note = {
  id: string;
  title: string;
  body: NoteLine[];
  // If present, the note is hidden from the library until this returns true.
  reveal?: (ctx: NoteCtx) => boolean;
};

const NOTES: Note[] = [
  {
    id: "001",
    title: "a note, half-remembered",
    body: [
      {
        text: "what you can read here bends to the state you're in — theme, locale, the hour. change yourself and the library changes with you. this line only holds in the light.",
        fx: "light-only",
      },
    ],
  },
  {
    id: "002",
    title: "a page left in the rain",
    body: [{ text: "…" }],
    reveal: (ctx) => ctx.weather != null && RAIN_GLYPHS.has(ctx.weather),
  },
];

const SHUTDOWN_LINES = [
  "shutdown signal received…",
  "[ ok ] stopping shell (zsh)",
  "[ ok ] flushing display buffer",
  "[ ok ] unmounting /dev/self",
  "powering off.",
];

// VPN exit nodes. Picking one re-routes the status-bar weather (and spoofs the
// host) to that city. "home" is the real location.
const HOME = "home";
const LOCATIONS: Record<
  string,
  { label: string; lat: number; lon: number; tz: string }
> = {
  home: {
    label: "chicago (home)",
    lat: 41.8781,
    lon: -87.6298,
    tz: "America/Chicago",
  },
  reykjavik: {
    label: "reykjavík",
    lat: 64.1466,
    lon: -21.9426,
    tz: "Atlantic/Reykjavik",
  },
  london: { label: "london", lat: 51.5074, lon: -0.1278, tz: "Europe/London" },
  tokyo: { label: "tokyo", lat: 35.6762, lon: 139.6503, tz: "Asia/Tokyo" },
  singapore: {
    label: "singapore",
    lat: 1.3521,
    lon: 103.8198,
    tz: "Asia/Singapore",
  },
  dubai: { label: "dubai", lat: 25.2048, lon: 55.2708, tz: "Asia/Dubai" },
  sydney: {
    label: "sydney",
    lat: -33.8688,
    lon: 151.2093,
    tz: "Australia/Sydney",
  },
};

// A resolved exit node — either a preset or a user-entered city.
type Place = { id: string; label: string; lat: number; lon: number; tz: string };

const homePlace = (): Place => ({ id: HOME, ...LOCATIONS[HOME] });

// Resolve a free-form city name → coordinates + timezone via Open-Meteo's
// geocoding API (no key). Returns null if nothing matches.
async function geocode(query: string): Promise<Place | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`,
    );
    if (!res.ok) return null;
    const r = (await res.json())?.results?.[0];
    if (!r || typeof r.latitude !== "number" || typeof r.longitude !== "number")
      return null;
    return {
      id: String(r.name ?? query)
        .toLowerCase()
        .replace(/\s+/g, "-"),
      label: [r.name, r.country_code].filter(Boolean).join(", ").toLowerCase(),
      lat: r.latitude,
      lon: r.longitude,
      tz: r.timezone ?? "UTC",
    };
  } catch {
    return null;
  }
}

// Time formatting, always in a given IANA timezone so tunneling changes the
// clock. Intl handles DST, so no manual offsets.
function formatClock(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

function formatTz(d: Date, tz: string) {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? "";
}

// WMO weather interpretation code → a single condition glyph.
function weatherGlyph(code: number): string {
  if (code === 0) return "☀";
  if (code <= 3) return "⛅";
  if (code === 45 || code === 48) return "🌫";
  if (code >= 51 && code <= 67) return "🌧";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "❄";
  if (code >= 80 && code <= 82) return "🌦";
  if (code >= 95) return "⛈";
  return "";
}

function formatFull(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
    year: "numeric",
  }).format(d);
}

type Palette = {
  bg: string;
  fg: string;
  out: string;
  user: string;
  path: string;
  dollar: string;
  cursor: string;
  bar: string;
};

// Five themes: two defaults plus accessibility options. The color-blind-safe
// palettes use Okabe-Ito colors so the prompt/status accents stay
// distinguishable under the named color-vision deficiency.
const PALETTES = {
  dark: {
    bg: "bg-black",
    fg: "text-neutral-200",
    out: "text-neutral-400",
    user: "text-emerald-400",
    path: "text-sky-400",
    dollar: "text-neutral-500",
    cursor: "text-neutral-200",
    bar: "bg-emerald-500 text-black",
  },
  light: {
    bg: "bg-neutral-100",
    fg: "text-neutral-800",
    out: "text-neutral-500",
    user: "text-emerald-700",
    path: "text-sky-700",
    dollar: "text-neutral-400",
    cursor: "text-neutral-800",
    bar: "bg-emerald-600 text-white",
  },
  contrast: {
    bg: "bg-black",
    fg: "text-white",
    out: "text-neutral-300",
    user: "text-[#ffff00]",
    path: "text-white",
    dollar: "text-[#ffff00]",
    cursor: "text-white",
    bar: "bg-white text-black",
  },
  redgreen: {
    bg: "bg-black",
    fg: "text-neutral-100",
    out: "text-neutral-400",
    user: "text-[#56b4e9]",
    path: "text-[#e69f00]",
    dollar: "text-neutral-500",
    cursor: "text-neutral-100",
    bar: "bg-[#0072b2] text-white",
  },
  blueyellow: {
    bg: "bg-black",
    fg: "text-neutral-100",
    out: "text-neutral-400",
    user: "text-[#d55e00]",
    path: "text-[#cc79a7]",
    dollar: "text-neutral-500",
    cursor: "text-neutral-100",
    bar: "bg-[#009e73] text-black",
  },
} satisfies Record<string, Palette>;

type Theme = keyof typeof PALETTES;

const THEME_DESC: Record<Theme, string> = {
  dark: "default dark",
  light: "default light",
  contrast: "high contrast",
  redgreen: "deuteranopia-safe (red / green)",
  blueyellow: "tritanopia-safe (blue / yellow)",
};

// Raw colors for the power-down pixel explosion. [0] is the accent (green)
// used for the status-bar band; the rest tint the scattered text pixels.
const BURST: Record<Theme, { bg: string; colors: string[] }> = {
  dark: {
    bg: "#000000",
    colors: ["#10b981", "#e5e5e5", "#a3a3a3", "#34d399", "#525252"],
  },
  light: {
    bg: "#f5f5f5",
    colors: ["#059669", "#404040", "#737373", "#a3a3a3", "#10b981"],
  },
  contrast: {
    bg: "#000000",
    colors: ["#ffffff", "#ffff00", "#e5e5e5", "#a3a3a3", "#ffffff"],
  },
  redgreen: {
    bg: "#000000",
    colors: ["#0072b2", "#56b4e9", "#e69f00", "#e5e5e5", "#a3a3a3"],
  },
  blueyellow: {
    bg: "#000000",
    colors: ["#009e73", "#d55e00", "#cc79a7", "#e5e5e5", "#a3a3a3"],
  },
};

function Prompt({ palette, host }: { palette: Palette; host: string }) {
  return (
    <>
      <span className={palette.user}>
        {USER}@{host}
      </span>
      <span className={palette.path}>:~</span>
      <span className={palette.dollar}>$ </span>
    </>
  );
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>([]);
  const [booting, setBooting] = useState(true);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [now, setNow] = useState<Date | null>(null);
  const [temp, setTemp] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [powered, setPowered] = useState(true);
  const [exploding, setExploding] = useState(false);
  const [shutting, setShutting] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const [place, setPlace] = useState<Place>(homePlace);

  const palette = PALETTES[theme];
  const activeHost = place.id === HOME ? HOST : place.id;
  const activeTz = place.tz;
  const clock = now ? formatClock(now, activeTz) : "--:--";
  const tzLabel = now ? formatTz(now, activeTz) : "";

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Temperature for the active location's status bar (Open-Meteo, no API key).
  // Re-fetches whenever the VPN exit node changes. Degrades silently offline.
  useEffect(() => {
    let cancelled = false;
    const fetchTemp = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`,
        );
        if (!res.ok) return;
        const data = await res.json();
        const t = data?.current?.temperature_2m;
        const code = data?.current?.weather_code;
        if (cancelled) return;
        if (typeof t === "number") setTemp(`${Math.round(t)}°F`);
        if (typeof code === "number") setCondition(weatherGlyph(code) || null);
      } catch {
        // offline or blocked — leave the temperature unset
      }
    };
    fetchTemp();
    const id = setInterval(fetchTemp, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [place]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  // Boot sequence: reveal the POST-style log lines one at a time, then settle
  // on the hint. Replays on every reboot. Input is inert until it finishes.
  useEffect(() => {
    if (!booting) return;
    const seq = [...BOOT_LINES, "", HINT];
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timers: number[] = [];
    if (reduced) {
      timers.push(
        window.setTimeout(() => {
          setLines(seq.map((text) => ({ kind: "output", text })));
          setBooting(false);
        }, 0),
      );
      return () => timers.forEach((t) => window.clearTimeout(t));
    }
    let delay = 120;
    seq.forEach((text, idx) => {
      timers.push(
        window.setTimeout(() => {
          setLines((prev) => [...prev, { kind: "output", text }]);
          if (idx === seq.length - 1) setBooting(false);
        }, delay),
      );
      delay += text.startsWith("[") ? 120 : 220;
    });
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [booting]);

  // Shutdown sequence: type out the power-off log, pause, then detonate.
  useEffect(() => {
    if (!shutting) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timers: number[] = [];
    const detonate = () => {
      setShutting(false);
      setExploding(true);
    };
    if (reduced) {
      timers.push(
        window.setTimeout(() => {
          setLines((prev) => [
            ...prev,
            ...SHUTDOWN_LINES.map((text) => ({ kind: "output" as const, text })),
          ]);
        }, 0),
      );
      timers.push(window.setTimeout(detonate, 250));
      return () => timers.forEach((t) => window.clearTimeout(t));
    }
    let delay = 180;
    SHUTDOWN_LINES.forEach((text) => {
      timers.push(
        window.setTimeout(() => {
          setLines((prev) => [...prev, { kind: "output", text }]);
        }, delay),
      );
      delay += 180;
    });
    timers.push(window.setTimeout(detonate, delay + 450));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [shutting]);

  // While powered down, any key or tap reboots to a fresh terminal. Arm after
  // a short delay so the keypress that ran `exit` doesn't instantly reboot —
  // otherwise the black screen never actually shows.
  useEffect(() => {
    if (powered) return;
    let armed = false;
    const arm = window.setTimeout(() => {
      armed = true;
    }, 400);
    const reboot = () => {
      if (!armed) return;
      setLines([]);
      setInput("");
      setHistory([]);
      setHistIdx(-1);
      setPowered(true);
      setBooting(true);
    };
    window.addEventListener("keydown", reboot);
    window.addEventListener("pointerdown", reboot);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("keydown", reboot);
      window.removeEventListener("pointerdown", reboot);
    };
  }, [powered]);

  function run(raw: string) {
    const promptEcho: Line = { kind: "input", text: raw };
    const cmd = raw.trim();
    if (!cmd) {
      setLines((l) => [...l, promptEcho]);
      return;
    }

    const [name, arg] = cmd.split(/\s+/);
    const rest = cmd.slice(name.length).trim();
    let out: string[];
    switch (name) {
      case "whoami":
        out = WHOAMI;
        break;
      case "theme": {
        if (!arg) {
          out = [
            "themes:",
            ...(Object.keys(PALETTES) as Theme[]).map(
              (t) =>
                `  ${t === theme ? "▸" : " "} ${t.padEnd(11)} ${THEME_DESC[t]}`,
            ),
            "",
            "usage: theme <name>",
          ];
          break;
        }
        if (arg in PALETTES) {
          setTheme(arg as Theme);
          out = [`theme → ${arg}`];
          break;
        }
        out = [`theme: unknown theme "${arg}". try: theme`];
        break;
      }
      case "vpn": {
        const query = rest.toLowerCase();
        if (!query) {
          out = [
            "exit nodes:",
            ...Object.entries(LOCATIONS).map(
              ([key, v]) =>
                `  ${place.id === key ? "▸" : " "} ${key.padEnd(10)} ${v.label}`,
            ),
            "",
            "usage: vpn <node> · vpn <any city> · vpn radar · vpn off",
          ];
          break;
        }
        if (query === "radar") {
          const url = "https://www.windy.com/";
          window.open(url, "_blank", "noopener,noreferrer");
          out = ["opening global precipitation radar…", url];
          break;
        }
        if (query === "off" || query === "disconnect" || query === HOME) {
          setPlace(homePlace());
          setTemp(null);
          setCondition(null);
          out = ["tunnel closed. routing locally — chicago."];
          break;
        }
        if (LOCATIONS[query]) {
          setPlace({ id: query, ...LOCATIONS[query] });
          setTemp(null);
          setCondition(null);
          out = [
            "establishing tunnel…",
            `connected · exit node: ${LOCATIONS[query].label}`,
          ];
          break;
        }
        // Free-form city — resolve it asynchronously.
        setLines((l) => [
          ...l,
          promptEcho,
          { kind: "output", text: `resolving "${rest}"…` },
        ]);
        geocode(rest).then((resolved) => {
          if (!resolved) {
            setLines((l) => [
              ...l,
              { kind: "output", text: `vpn: could not resolve "${rest}".` },
            ]);
            return;
          }
          setPlace(resolved);
          setTemp(null);
          setCondition(null);
          setLines((l) => [
            ...l,
            { kind: "output", text: "establishing tunnel…" },
            { kind: "output", text: `connected · exit node: ${resolved.label}` },
          ]);
        });
        return;
      }
      case "library": {
        const noteCtx: NoteCtx = { theme, place, weather: condition, now };
        const visible = NOTES.filter((n) => !n.reveal || n.reveal(noteCtx));
        if (!arg) {
          out = [
            "library — clues collected:",
            ...(visible.length
              ? visible.map((n) => `  ${n.id}  ${n.title}`)
              : ["  (empty)"]),
            "",
            "usage: library <id>",
          ];
          break;
        }
        const note = visible.find((n) => n.id === arg);
        if (!note) {
          out = [`library: no entry "${arg}".`];
          break;
        }
        setLines((l) => [
          ...l,
          promptEcho,
          { kind: "output", text: `— ${note.title} —` },
          ...note.body.map((nl) => ({
            kind: "output" as const,
            text: nl.text,
            fx: nl.fx,
          })),
        ]);
        return;
      }
      case "settings": {
        out = [
          "settings",
          `  theme       ${theme}`,
          `  location    ${place.label}${place.id === HOME ? "" : " · vpn"}`,
          "",
          "change: theme <name> · vpn <city>",
        ];
        break;
      }
      case "date": {
        const d = new Date();
        if (arg === "-u" || arg === "--utc") {
          out = [formatFull(d, "UTC")];
        } else {
          out = [formatFull(d, activeTz)];
        }
        break;
      }
      case "help":
        out = HELP;
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
        setLines((l) => [...l, promptEcho]);
        setShutting(true);
        return;
      default:
        out = [`zsh: command not found: ${name}`];
    }

    setLines((l) => [
      ...l,
      promptEcho,
      ...out.map((text) => ({ kind: "output" as const, text })),
    ]);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (booting || shutting) return;
    if (e.key === "Enter") {
      run(input);
      if (input.trim()) setHistory((h) => [input, ...h]);
      setInput("");
      setHistIdx(-1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length) {
        const ni = Math.min(histIdx + 1, history.length - 1);
        setHistIdx(ni);
        setInput(history[ni]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const ni = histIdx - 1;
      if (ni < 0) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(ni);
        setInput(history[ni]);
      }
    }
  }

  if (exploding) {
    const burst = BURST[theme];
    return (
      <PixelBurst
        colors={burst.colors}
        bg={burst.bg}
        onDone={() => {
          setExploding(false);
          setPowered(false);
        }}
      />
    );
  }

  if (!powered) {
    return <div className={`fixed inset-0 ${palette.bg}`} aria-hidden="true" />;
  }

  return (
    <div
      className={`fixed inset-0 flex flex-col font-mono text-[15px] leading-relaxed md:text-base ${palette.bg} ${palette.fg}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {lines.map((line, i) =>
          line.kind === "input" ? (
            <div key={i} className="whitespace-pre-wrap break-words">
              <Prompt palette={palette} host={activeHost} />
              {line.text}
            </div>
          ) : (
            <div
              key={i}
              className={`whitespace-pre-wrap break-words ${palette.out} ${line.fx === "fade" ? "note-fade" : line.fx === "dark-only" && theme !== "dark" ? "note-locked" : line.fx === "light-only" && theme !== "light" ? "note-locked" : ""}`}
            >
              {line.text || " "}
            </div>
          ),
        )}

        {!booting && !shutting ? (
        <div className="whitespace-pre-wrap break-words">
          <Prompt palette={palette} host={activeHost} />
          {input}
          <span className={`terminal-cursor ${palette.cursor}`}>▋</span>
        </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">
            <span className={`terminal-cursor ${palette.cursor}`}>▋</span>
          </div>
        )}

        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          className="absolute h-0 w-0 opacity-0"
          aria-label="terminal input"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      {/* tmux status bar */}
      <div
        className={`flex h-7 select-none items-center justify-between px-2 text-[13px] md:h-6 md:text-xs ${palette.bar}`}
      >
        <span>
          [{place.id !== HOME ? "⇄ " : ""}
          {activeHost}] 0:zsh<span className="font-bold">*</span>
        </span>
        <span>
          {USER}@{activeHost} · {condition ? `${condition} ` : ""}
          {temp ? `${temp} · ` : ""}
          {clock}
          {tzLabel ? ` ${tzLabel}` : ""}
        </span>
      </div>
    </div>
  );
}
