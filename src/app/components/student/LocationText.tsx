import { splitLocationText } from "@/lib/locationLink";

type LocationTextProps = {
  value: string;
  className?: string;
  linkClassName?: string;
};

export function LocationText({
  value,
  className,
  linkClassName = "text-[#2563eb] underline underline-offset-2 hover:text-[#1d4ed8]",
}: LocationTextProps) {
  const parts = splitLocationText(value);
  const hasLink = parts.some((part) => part.kind === "link");

  if (!hasLink) {
    return <span className={className}>{value}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.kind === "link" ? (
          <a
            key={index}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClassName}
          >
            {part.label}
          </a>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </span>
  );
}
