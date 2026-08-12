import { parse } from "@twemoji/parser";
import { Fragment } from "react";

/**
 * Renders a single emoji as a Twemoji SVG image, sized to fill its container
 * — for standalone emoji (reaction badges, picker buttons), not inline text.
 * Apple's own emoji font/images are proprietary and can't be redistributed;
 * Twemoji (MIT + CC-BY-4.0) renders identically for every user regardless of
 * their OS, instead of falling back to whatever Android/Windows ships.
 */
export function Emoji({ emoji, className }: { emoji: string; className?: string }) {
  const [entity] = parse(emoji);
  if (!entity) return <>{emoji}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny decorative CDN icon, not an LCP-relevant content image
    <img
      src={entity.url}
      alt={emoji}
      draggable={false}
      className={className ?? "inline-block h-full w-full"}
    />
  );
}

/**
 * Renders a string that may contain emoji anywhere inside it — plain text
 * stays as text, each emoji becomes an inline Twemoji image sized to match
 * the surrounding line of text. Returns a Fragment (no wrapper element) so
 * it drops directly into an existing <p>/<span>.
 */
export function EmojiText({ text, emojiClassName }: { text: string; emojiClassName?: string }) {
  const entities = parse(text);
  if (entities.length === 0) return <>{text}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  entities.forEach((entity, i) => {
    const [start, end] = entity.indices;
    if (start > cursor) nodes.push(<Fragment key={`t-${i}`}>{text.slice(cursor, start)}</Fragment>);
    nodes.push(
      // eslint-disable-next-line @next/next/no-img-element -- tiny decorative CDN icon, not an LCP-relevant content image
      <img
        key={`e-${i}`}
        src={entity.url}
        alt={entity.text}
        draggable={false}
        className={emojiClassName ?? "inline-block h-[1.2em] w-[1.2em] align-[-0.2em]"}
      />,
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(<Fragment key="t-end">{text.slice(cursor)}</Fragment>);

  return <>{nodes}</>;
}
