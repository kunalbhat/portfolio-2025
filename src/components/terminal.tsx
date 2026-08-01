"use client";

import { useEffect, useRef, useState } from "react";
import PixelBurst from "@/components/pixel-burst";

type Line = { kind: "input" | "output"; text: string };

const USER = "kunal";
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
  "  theme    — toggle light / dark",
  "  clear    — clear the screen",
  "  exit     — power down",
  "  help     — this list",
];

const INITIAL_LINES: Line[] = [
  { kind: "output", text: "// a blinking prompt in the dark. try: whoami" },
];

type Theme = "dark" | "light";

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

const PALETTES: Record<Theme, Palette> = {
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
};

function Prompt({ palette }: { palette: Palette }) {
  return (
    <>
      <span className={palette.user}>
        {USER}@{HOST}
      </span>
      <span className={palette.path}>:~</span>
      <span className={palette.dollar}>$ </span>
    </>
  );
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(INITIAL_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [clock, setClock] = useState("--:--");
  const [powered, setPowered] = useState(true);
  const [exploding, setExploding] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  const palette = PALETTES[theme];

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setClock(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

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
      setLines(INITIAL_LINES);
      setInput("");
      setHistory([]);
      setHistIdx(-1);
      setPowered(true);
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
    let out: string[];
    switch (name) {
      case "whoami":
        out = WHOAMI;
        break;
      case "theme": {
        const next: Theme =
          arg === "light" || arg === "dark"
            ? arg
            : theme === "dark"
              ? "light"
              : "dark";
        setTheme(next);
        out = [`theme → ${next}`];
        break;
      }
      case "help":
        out = HELP;
        break;
      case "clear":
        setLines([]);
        return;
      case "exit":
        setExploding(true);
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
              <Prompt palette={palette} />
              {line.text}
            </div>
          ) : (
            <div
              key={i}
              className={`whitespace-pre-wrap break-words ${palette.out}`}
            >
              {line.text || " "}
            </div>
          ),
        )}

        <div className="whitespace-pre-wrap break-words">
          <Prompt palette={palette} />
          {input}
          <span className={`terminal-cursor ${palette.cursor}`}>▋</span>
        </div>

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
          [{HOST}] 0:zsh<span className="font-bold">*</span>
        </span>
        <span>
          {USER}@{HOST} · {clock}
        </span>
      </div>
    </div>
  );
}
