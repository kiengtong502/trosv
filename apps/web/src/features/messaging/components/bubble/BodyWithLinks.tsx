import { splitLinks } from "./messageContent";

/** Message text with http(s) links and /rooms/ links turned into anchors. */
export function BodyWithLinks({ text }: { text: string }) {
  const parts = splitLinks(text);
  if (parts.length === 1) return <>{text}</>;

  return (
    <>
      {parts.map((part, index) => {
        // split() with a capture group puts the matched links at the odd positions.
        if (index % 2 === 0) return part;
        const isInternal = part.startsWith("/rooms/");
        return (
          <a
            key={index}
            href={part}
            target={isInternal ? undefined : "_blank"}
            rel={isInternal ? undefined : "noopener noreferrer"}
            className="font-medium underline hover:opacity-80 transition-opacity break-all text-inherit"
          >
            {part}
          </a>
        );
      })}
    </>
  );
}
