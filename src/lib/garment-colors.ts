/**
 * Shared vocabulary of garment colors. The mock generator draws titles from
 * these names and the thumbnail swatch looks the name back up, so a listing
 * called "Olive Detroit Jacket" always shows an olive tile.
 *
 * Live adapters benefit from the same lookup: when a marketplace gives us a
 * listing without a photo, the title is usually still enough to show the color.
 */
export type GarmentColor = {
  name: string;
  /** Swatch background. */
  hex: string;
  /** Readable foreground against `hex`. */
  ink: string;
};

export const GARMENT_COLORS: readonly GarmentColor[] = [
  { name: "Black", hex: "#1c1c1e", ink: "#e9e9ec" },
  { name: "Charcoal", hex: "#3a3d42", ink: "#e9e9ec" },
  { name: "Navy", hex: "#1e2a44", ink: "#dbe3f2" },
  { name: "Forest Green", hex: "#2d4a35", ink: "#dcebe0" },
  { name: "Olive", hex: "#5a6340", ink: "#eef0e2" },
  { name: "Burgundy", hex: "#5c1f2b", ink: "#f3dde1" },
  { name: "Rust", hex: "#9c4a21", ink: "#fbe8dc" },
  { name: "Camel", hex: "#b4875a", ink: "#2b1d10" },
  { name: "Washed Blue", hex: "#7d9cc0", ink: "#14202e" },
  { name: "Cream", hex: "#efe6d2", ink: "#3b3324" },
];

export const GARMENT_COLOR_NAMES = GARMENT_COLORS.map((color) => color.name);

/**
 * Finds the color a listing title mentions. Longer names are checked first so
 * "Forest Green" wins over "Green" would-be matches.
 */
export function findGarmentColor(title: string): GarmentColor | undefined {
  const haystack = title.toLowerCase();
  return [...GARMENT_COLORS]
    .sort((a, b) => b.name.length - a.name.length)
    .find((color) => haystack.includes(color.name.toLowerCase()));
}
