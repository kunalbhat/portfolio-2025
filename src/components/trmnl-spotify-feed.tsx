import Link from "next/link";

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

function pickFirstArrayCandidate(data: unknown): RawSpotifyItem[] {
  if (!data) return [];
  const asObject = (value: unknown) =>
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : undefined;

  const root = asObject(data);
  const items = root?.items;
  const tracks = asObject(root?.tracks);
  const dataNode = asObject(root?.data);
  const body = asObject(root?.body);

  const candidates: unknown[] = [
    data,
    items,
    root?.tracks,
    tracks?.items,
    root?.data,
    dataNode?.items,
    root?.body,
    body?.items,
    root?.recently_played,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as RawSpotifyItem[];
  }
  return [];
}

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
    const res = await fetch(ENDPOINT, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    const data = await res.json();
    const list: RawSpotifyItem[] = pickFirstArrayCandidate(data);
    const normalized = list.map(normalizeItem).filter((item) => item.title);
    return normalized.slice(0, limit || normalized.length);
  } catch {
    return [];
  }
}

type TrmnlSpotifyFeedProps = {
  title?: string;
  limit?: number;
};

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

  const visible = items.slice(0, limit ?? 6);

  return (
    <section className="space-y-4">
      <div className="space-y-1 mb-8">
        <div className="flex items-baseline gap-3">
          <h3 className="text-2xl font-semibold">{title}</h3>
        </div>
        <p className="text-base text-(--muted)">
          Powered by my Spotify endpoint —{" "}
          <Link href="/work/trmnl" className="underline underline-offset-4">
            learn more!
          </Link>
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {visible.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border border-(--border) bg-(--bg) px-2 py-1.5 md:px-3 md:py-2 shadow-[0_12px_24px_rgba(0,0,0,0.14)]"
          >
            <figure
              className="h-16 w-16 rounded-xl overflow-hidden border border-(--border) bg-(--bg-muted) shrink-0"
              style={{ width: 64, height: 64 }}
            >
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
            <figcaption className="flex-1 min-w-0 my-2 space-y-0.5">
              <h5 className="font-semibold mb-0 break-word">{item.title}</h5>
              <span className="block text-xs md:text-sm text-(--muted) break-word">
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
