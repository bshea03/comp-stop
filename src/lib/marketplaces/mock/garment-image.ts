import type { GarmentColor } from "@/lib/garment-colors";
import { createRng } from "@/lib/marketplaces/mock/seeded-random";

export const GARMENT_KINDS = [
  "jacket",
  "jeans",
  "pants",
  "dress",
  "pullover",
  "shirt",
  "shorts",
  "shoes",
  "generic",
] as const;

export type GarmentKind = (typeof GARMENT_KINDS)[number];

const RULES: { kind: GarmentKind; pattern: RegExp }[] = [
  { kind: "jacket", pattern: /\b(jacket|coat|parka|bomber|trucker|detroit|blazer|anorak|windbreaker|raincoat)\b/i },
  { kind: "dress", pattern: /\b(dress|gown|sundress|shift|maxi|midi)\b/i },
  { kind: "jeans", pattern: /\b(jeans|501|denim)\b/i },
  { kind: "shorts", pattern: /\b(shorts|cutoffs)\b/i },
  { kind: "pants", pattern: /\b(pants|trousers|chinos|slacks|joggers|sweatpants)\b/i },
  { kind: "pullover", pattern: /\b(pullover|fleece|hoodie|hoody|sweater|sweatshirt|jumper|cardigan)\b/i },
  { kind: "shirt", pattern: /\b(shirt|blouse|tee|t-shirt|tshirt|polo|henley)\b/i },
  { kind: "shoes", pattern: /\b(shoes|sneakers|boots|loafers|trainers|clogs)\b/i },
];

/** Picks a silhouette from the search keywords so a jacket search does not draw jeans. */
export function classifyGarment(keywords: string): GarmentKind {
  return RULES.find((rule) => rule.pattern.test(keywords))?.kind ?? "generic";
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function mix(hex: string, toward: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  const [tr, tg, tb] = hexToRgb(toward);
  return rgbToHex(
    r + (tr - r) * amount,
    g + (tg - g) * amount,
    b + (tb - b) * amount,
  );
}

function garmentSvg(kind: GarmentKind, color: string, variant: number): string {
  const light = mix(color, "#ffffff", 0.28);
  const dark = mix(color, "#111111", 0.32);
  const stitch = mix(color, "#ffffff", 0.14);
  const flip = variant % 2 === 0 ? 1 : -1;
  const tilt = ((variant % 5) - 2) * 1.6;

  const body = (() => {
    switch (kind) {
      case "jacket":
        return `
          <path d="M36 30 42 24h28l6 6 8 16-6 42H34l-6-42Z" fill="${color}"/>
          <path d="M42 24 50 32h12l8-8" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linejoin="round"/>
          <path d="M56 34v46" fill="none" stroke="${light}" stroke-width="2" stroke-linecap="round"/>
          <path d="M40 62h12M60 62h12" fill="none" stroke="${dark}" stroke-width="1.6" stroke-linejoin="round"/>
          <circle cx="56" cy="40" r="1.3" fill="${light}"/>
          <circle cx="56" cy="48" r="1.3" fill="${light}"/>
          <circle cx="56" cy="56" r="1.3" fill="${light}"/>
        `;
      case "jeans":
        return `
          <path d="M40 22h32l2 18-6 50H58l-2-32-2 32H44l-6-50Z" fill="${color}"/>
          <path d="M56 40v50" fill="none" stroke="${dark}" stroke-width="2"/>
          <path d="M44 28h24" fill="none" stroke="${stitch}" stroke-width="1.4" stroke-dasharray="2 2"/>
          <path d="M46 36h8M58 36h8" fill="none" stroke="${dark}" stroke-width="1.4"/>
        `;
      case "pants":
        return `
          <path d="M39 22h34l3 16-7 52H59l-3-34-3 34H43l-7-52Z" fill="${color}"/>
          <path d="M56 38v52" fill="none" stroke="${dark}" stroke-width="2"/>
          <path d="M44 30h24" fill="none" stroke="${stitch}" stroke-width="1.5"/>
        `;
      case "dress":
        return `
          <path d="M48 20h16l4 8-6 10 18 46H32l18-46-6-10Z" fill="${color}"/>
          <path d="M46 40h20" fill="none" stroke="${stitch}" stroke-width="1.4" stroke-dasharray="2 2"/>
          <path d="M56 28v12" fill="none" stroke="${light}" stroke-width="1.6"/>
        `;
      case "pullover":
        return `
          <path d="M28 38 42 28h28l14 10v14l-10 4v28H38V56l-10-4Z" fill="${color}"/>
          <path d="M46 28c0 8 4 12 10 12s10-4 10-12" fill="none" stroke="${dark}" stroke-width="2.2"/>
          <path d="M42 58h28" fill="none" stroke="${stitch}" stroke-width="1.5"/>
        `;
      case "shirt":
        return `
          <path d="M34 30 44 24h24l10 6 6 12-8 4v38H36V52l-8-4Z" fill="${color}"/>
          <path d="M44 24 56 36 68 24" fill="none" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="56" cy="44" r="1.2" fill="${light}"/>
          <circle cx="56" cy="52" r="1.2" fill="${light}"/>
          <circle cx="56" cy="60" r="1.2" fill="${light}"/>
        `;
      case "shorts":
        return `
          <path d="M40 30h32l2 10-4 28H58l-2-16-2 16H44l-4-28Z" fill="${color}"/>
          <path d="M56 40v28" fill="none" stroke="${dark}" stroke-width="2"/>
          <path d="M44 36h24" fill="none" stroke="${stitch}" stroke-width="1.4"/>
        `;
      case "shoes":
        return `
          <path d="M24 62c8-18 20-26 36-26 18 0 30 8 34 18v12H28Z" fill="${color}"/>
          <path d="M28 66h64v6H32Z" fill="${dark}"/>
          <path d="M42 44c6 6 14 10 28 10" fill="none" stroke="${light}" stroke-width="2"/>
        `;
      default:
        return `
          <path d="M32 34 44 26h24l12 8v48H32Z" fill="${color}"/>
          <path d="M44 26 56 36 68 26" fill="none" stroke="${dark}" stroke-width="2" stroke-linejoin="round"/>
          <path d="M40 48h32" fill="none" stroke="${stitch}" stroke-width="1.4"/>
        `;
    }
  })();

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 112" width="112" height="112">
  <rect width="112" height="112" rx="10" fill="#ece8e1"/>
  <rect x="8" y="8" width="96" height="96" rx="8" fill="#f7f3ec"/>
  <g transform="translate(56 58) rotate(${tilt}) scale(${flip} 1) translate(-56 -58)">
    ${body}
  </g>
</svg>`;
}

/**
 * Deterministic product-style picture for a mock listing. Live adapters
 * replace this with the marketplace's own photo via `imageUrl`.
 */
export function mockGarmentImageUrl(options: {
  kind: GarmentKind;
  color: GarmentColor;
  seed: string;
}): string {
  const variant = createRng(options.seed).int(0, 99);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    garmentSvg(options.kind, options.color.hex, variant),
  )}`;
}
