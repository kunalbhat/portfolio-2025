import type { CSSProperties } from "react";

const ENDPOINT = "https://trmnl-spotify-server.vercel.app/api/spotify";

type RawSpotifyItem = {
  id?: string;
  track?: string;
  title?: string;
  artist?: string;
  album?:
    | string
    | {
        images?: { url?: string; src?: string; href?: string }[] | string[];
        image?: string | { url?: string; src?: string; href?: string };
        cover?: string | { url?: string; src?: string; href?: string };
      };
  albumArtist?: string;
  albumArt?: string;
  image?: string;
  cover?: string;
  artwork?: string;
  artworkUrl?: string;
  subtitle?: string;
  image_url?: string;
  imageUrl?: string;
  url?: string;
  href?: string;
  link?: string;
  playedAt?: string;
  timestamp?: string;
  albumImages?: { url?: string; src?: string; href?: string }[];
  images?: { url?: string; src?: string; href?: string }[] | string[];
};

type NormalizedSpotifyItem = {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  image?: string;
  link?: string;
};

function pickImage(candidate: unknown): string | undefined {
  if (!candidate) return undefined;
  if (typeof candidate === "string") return candidate;
  if (Array.isArray(candidate)) {
    for (const entry of candidate) {
      const found = pickImage(entry);
      if (found) return found;
    }
    return undefined;
  }
  if (candidate && typeof candidate === "object") {
    const obj = candidate as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.href === "string") return obj.href;
    if (typeof obj.src === "string") return obj.src;
    return undefined;
  }
  return undefined;
}

function normalizeItem(
  item: RawSpotifyItem,
  index: number
): NormalizedSpotifyItem {
  const title = item.track || item.title || "Unknown track";
  const artist = item.artist || item.albumArtist || item.subtitle;
  const album = typeof item.album === "string" ? item.album : undefined;
  const albumImage =
    typeof item.album === "object" && item.album
      ? pickImage(item.album.images) ||
        pickImage(item.album.image) ||
        pickImage(item.album.cover)
      : undefined;
  const image =
    pickImage(item.albumArt) ||
    pickImage(item.image) ||
    pickImage(item.image_url) ||
    pickImage(item.imageUrl) ||
    pickImage(item.cover) ||
    pickImage(item.artwork) ||
    pickImage(item.artworkUrl) ||
    pickImage(item.albumImages) ||
    pickImage(item.images) ||
    albumImage;
  const link = item.url || item.href || item.link || undefined;
  const id =
    item.id ||
    item.track ||
    item.title ||
    item.timestamp ||
    item.playedAt ||
    `${title}-${artist || "artist"}-${index}`;

  return { id, title, artist, album, image, link };
}

async function fetchSpotifyItems(limit?: number) {
  try {
    const res = await fetch(ENDPOINT, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }

    const data = await res.json();
    const list: RawSpotifyItem[] = Array.isArray(data)
      ? data
      : data?.items || data?.tracks || data?.data || [];

    const normalized = list.map(normalizeItem).filter((item) => item.title);

    const sliced = normalized.slice(0, limit || normalized.length);
    return sliced.reverse();
  } catch {
    return [];
  }
}

type TrmnlSpotifyFeedProps = {
  title?: string;
  limit?: number;
};

/**
 * Server component that fetches Spotify data from the TRMNL endpoint and renders it as cards.
 */
export default async function TrmnlSpotifyFeed({
  title = "TRMNL Spotify Feed",
  limit,
}: TrmnlSpotifyFeedProps) {
  const items = await fetchSpotifyItems(limit);

  if (!items.length) {
    return (
      <div className="space-y-3">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="text-(--muted)">
          No Spotify activity available right now.
        </p>
      </div>
    );
  }

  const columns = Math.max(1, Math.ceil(Math.sqrt(items.length)));
  const rows = Math.max(1, Math.ceil(items.length / columns));
  const midCol = (columns - 1) / 2;
  const midRow = (rows - 1) / 2;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h3 className="text-2xl font-semibold">{title}</h3>
      </div>
      <div className="space-y-0 group/list relative pt-12 md:pt-14">
        {items.map((item, index) => (
          <div
            key={item.id}
            tabIndex={0}
            className="group relative flex items-center gap-2 rounded-2xl border border-(--border) bg-(--bg) px-2 py-0.5 md:px-3 md:py-0.5 shadow-[0_12px_24px_rgba(0,0,0,0.14)] transition-transform duration-400 ease-out -mt-24 first:mt-0 transform translate-x-[var(--x)] translate-y-[var(--y)] skew-y-[var(--skew-base)] group-hover/list:translate-x-[var(--x-hover)] group-hover/list:translate-y-[var(--y-hover)] group-hover/list:skew-y-0 group-hover/list:scale-[1.05] group-hover/list:shadow-[0_18px_36px_rgba(0,0,0,0.2)] focus:translate-x-[var(--x-hover)] focus:translate-y-[var(--y-hover)] focus:skew-y-0 focus:scale-[1.05] focus:shadow-[0_18px_36px_rgba(0,0,0,0.2)] focus:outline-none"
            style={
              {
                zIndex: 50 - index,
                "--x": "0px",
                "--y": "0px",
                "--x-hover": `${
                  (index % columns - midCol) * 120
                }px`,
                "--y-hover": `${
                  (Math.floor(index / columns) - midRow) * 100
                }px`,
                "--skew-base": index % 2 === 0 ? "2deg" : "-2deg",
                "--skew": index % 2 === 0 ? "2deg" : "-2deg",
              } as CSSProperties
            }
          >
            <figure className="h-16 w-16 rounded-xl overflow-hidden border border-(--border) bg-(--bg-muted) shrink-0">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={`${item.title}${
                    item.artist ? ` by ${item.artist}` : ""
                  }`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-(--muted) text-xs">
                  No art
                </div>
              )}
            </figure>
            <figcaption className="flex-1 min-w-0 my-4 space-y-0.5">
              <h4 className="text-base md:text-xl font-semibold leading-snug truncate">
                {item.title}
              </h4>
              <span className="block text-xs md:text-sm text-(--muted) truncate">
                {item.artist || "Unknown artist"}
                {item.album ? ` • ${item.album}` : ""}
              </span>
              {item.link ? (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm underline underline-offset-4"
                >
                  Listen
                </a>
              ) : null}
            </figcaption>
          </div>
        ))}
      </div>
    </section>
  );
}
