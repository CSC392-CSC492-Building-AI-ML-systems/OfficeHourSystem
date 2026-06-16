import type { TaListItem } from "@/lib/queries/offeringMember";

export type { TaListItem };

export function formatTaDisplayName(ta: TaListItem): string {
  const fullName = [ta.firstName, ta.lastName].filter(Boolean).join(" ");
  return fullName || ta.utorid;
}

export function getTaInitials(ta: TaListItem): string {
  const displayName = formatTaDisplayName(ta);
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getTaSearchText(ta: TaListItem): string {
  return [
    ta.utorid,
    ta.firstName,
    ta.lastName,
    ta.email,
    formatTaDisplayName(ta),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function taMatchesSearch(ta: TaListItem, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  const haystack = getTaSearchText(ta);
  const tokens = normalizedQuery.split(/\s+/);
  return tokens.every((token) => haystack.includes(token));
}
