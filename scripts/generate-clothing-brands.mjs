import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const athletic = [
  "Nike", "Jordan", "Adidas", "Yeezy", "New Balance", "Asics", "Onitsuka Tiger",
  "Puma", "Reebok", "Converse", "Vans", "Fila", "Champion", "Under Armour",
  "Lululemon", "Gymshark", "Alo Yoga", "Outdoor Voices", "Vuori", "Brooks",
  "Saucony", "Hoka", "On Running", "Salomon", "Merrell", "Mizuno", "Diadora",
  "Ellesse", "Kappa", "Umbro", "Starter", "Mitchell & Ness", "'47 Brand", "New Era",
];

const streetwear = [
  "Supreme", "Stüssy", "Stussy", "Palace", "A Bathing Ape", "BAPE", "Kith", "Noah",
  "Aimé Leon Dore", "Fear of God", "Essentials", "Off-White", "Rhude", "Awake NY",
  "Billionaire Boys Club", "Undefeated", "Obey", "HUF", "Diamond Supply Co.",
  "The Hundreds", "Primitive", "Ripndip", "Anti Social Social Club", "Gallery Dept.",
  "Amiri", "John Elliott", "Ksubi", "Represent", "Cole Buxton", "Palm Angels",
  "Carhartt WIP", "WTAPS", "Neighborhood", "Human Made", "Visvim", "Kapital",
  "Needles", "Sacai", "Comme des Garçons", "Comme des Garçons PLAY", "Junya Watanabe",
  "Undercover", "Number (N)ine", "Engineered Garments", "Nanamica", "Beams",
  "Beams Plus", "Stone Island", "CP Company", "A-COLD-WALL*", "Brain Dead",
  "Online Ceramics", "Telfar", "Hellstar", "Sp5der", "Denim Tears",
];

const luxury = [
  "Gucci", "Prada", "Louis Vuitton", "Chanel", "Dior", "Balenciaga", "Saint Laurent",
  "Yves Saint Laurent", "Bottega Veneta", "Fendi", "Burberry", "Versace", "Valentino",
  "Givenchy", "Celine", "Loewe", "Moncler", "Hermès", "Chrome Hearts",
  "Maison Margiela", "MM6 Maison Margiela", "Balmain", "Dolce & Gabbana",
  "Salvatore Ferragamo", "Tod's", "Brunello Cucinelli", "Ermenegildo Zegna",
  "Tom Ford", "Lanvin", "Chloé", "MCM", "Miu Miu", "Vetements", "Rick Owens",
  "Raf Simons", "Issey Miyake", "Yohji Yamamoto", "Acne Studios", "AMI Paris",
  "A.P.C.", "Jacquemus", "Ganni", "Kenzo", "Paul Smith", "Maison Kitsuné",
  "Golden Goose", "Common Projects", "Canada Goose", "Moose Knuckles", "Parajumpers",
];

const heritage = [
  "Carhartt", "Dickies", "Levi's", "Wrangler", "Lee", "Pendleton", "Woolrich",
  "Filson", "Orvis", "L.L.Bean", "Red Wing", "Wolverine", "Thorogood", "Danner",
  "Timberland", "Dr. Martens", "Blundstone", "Birkenstock", "Barbour", "Belstaff",
  "Schott NYC", "Alpha Industries", "Harley-Davidson", "Ben Davis", "True Religion",
  "Rock Revival", "Miss Me", "Caterpillar", "Timberland PRO", "Double H Boots",
  "Frye", "Justin Boots", "Tony Lama", "Lucchese", "Ariat", "Walls", "Berne",
];

const contemporary = [
  "Zara", "H&M", "Uniqlo", "Mango", "COS", "Arket", "& Other Stories",
  "Massimo Dutti", "Bershka", "Pull&Bear", "Stradivarius", "Reserved", "Muji", "GU",
  "Everlane", "Quince", "Skims", "Free People", "Anthropologie", "Reformation",
  "Madewell", "J.Crew", "Banana Republic", "Gap", "Old Navy", "Athleta",
  "Abercrombie & Fitch", "Hollister", "American Eagle", "Aerie", "Brandy Melville",
  "Urban Outfitters", "For Love & Lemons", "Show Me Your Mumu", "Zimmermann",
  "Farm Rio", "Lilly Pulitzer", "Johnny Was", "Eileen Fisher", "Theory", "Vince",
  "AllSaints", "Reiss", "Express", "Torrid", "Lane Bryant", "Universal Standard",
  "Good American", "Fashion Nova", "Shein", "Princess Polly", "White Fox Boutique",
  "ASOS", "Boohoo", "PrettyLittleThing", "Nasty Gal", "Revolve",
];

const poshmark = [
  "Tory Burch", "Kate Spade", "Coach", "Michael Kors", "Dooney & Bourke", "Fossil",
  "Ann Taylor", "Loft", "Talbots", "Chico's", "White House Black Market", "Soma",
  "J.Jill", "Soft Surroundings", "Coldwater Creek", "Christopher & Banks",
  "Lands' End", "NYDJ", "KUT from the Kloth", "Boden", "Joules", "Seasalt",
  "FatFace", "Superdry", "French Connection", "Ted Baker", "Whistles", "Hobbs",
  "Phase Eight", "Monsoon", "Karen Millen", "Longchamp", "Furla", "Polene",
  "Marc Jacobs", "Radley", "Cuyana", "Dagne Dover", "Juicy Couture", "Kate Spade New York",
];

const grailed = [
  "OrSlow", "Snow Peak", "White Mountaineering", "And Wander", "Goldwin", "Descente",
  "Montbell", "Our Legacy", "Sunflower", "Lemaire", "Jil Sander", "Helmut Lang",
  "Ann Demeulemeester", "Haider Ackermann", "Guidi", "Craig Green", "Kiko Kostadinov",
  "We11done", "Thisisneverthat", "Patta", "Stone Island Shadow Project", "Moncler Genius",
  "Moncler Grenoble", "Arc'teryx Veilance", "Salomon Advanced", "Merrell 1TRL",
  "Buzz Rickson's", "Real McCoy's", "Warehouse & Co.", "The Flat Head", "Fullcount",
  "Samurai Jeans", "Pure Blue Japan", "Iron Heart", "Studio D'Artisan", "Loopwheeler",
];

const depopVintage = [
  "Polo Sport", "Nautica", "Chaps", "Juicy Couture", "Ed Hardy", "Von Dutch",
  "Baby Phat", "Rocawear", "Sean John", "Ecko Unltd.", "Southpole", "LRG",
  "Ice Cream", "7 For All Mankind", "Citizens of Humanity", "AG Jeans", "Paige",
  "Mother", "Frame", "Re/Done", "Agolde", "Spell", "Los Angeles Apparel",
  "American Apparel", "Alternative Apparel", "Comfort Colors", "Independent Trading Co.",
];

const kids = [
  "Carter's", "OshKosh B'gosh", "Gymboree", "Janie and Jack", "Tea Collection",
  "Hanna Andersson", "Primary", "Cat & Jack", "The Children's Place", "Justice",
  "Gap Kids", "Baby Gap", "Bonpoint", "Petit Bateau", "Jacadi", "Mayoral",
];

const europe = [
  "Primark", "Penneys", "Marks & Spencer", "Next", "River Island", "Topshop",
  "Topman", "New Look", "Monki", "Weekday", "Cheap Monday", "Oysho", "Sinsay",
  "House", "Mohito", "Cropp", "Accessorize", "Kurt Geiger", "Office", "Schuh",
  "Clarks", "Aquascutum", "Hunter", "White Stuff", "Cath Kidston", "Bench",
  "Oasis", "Warehouse", "Coast", "Missguided",
];

const mallAndClassic = [
  "Ralph Lauren", "Polo Ralph Lauren", "Tommy Hilfiger", "Calvin Klein", "Nautica",
  "Izod", "Chaps", "Dockers", "Brooks Brothers", "Van Heusen", "Stafford",
  "Jos A. Bank", "Men's Wearhouse", "SuitSupply", "Bonobos", "Ministry of Supply",
  "Taylor Stitch", "Buck Mason", "Marine Layer", "Faherty", "Howler Brothers",
  "Roark", "Billabong", "Quiksilver", "Roxy", "Volcom", "RVCA", "O'Neill", "Hurley",
  "Rip Curl", "O'Neills", "Diesel", "G-Star RAW", "Nudie Jeans", "Naked & Famous",
  "Fred Perry", "Hunter", "Sorel", "UGG", "Bearpaw", "Minnetonka", "Moon Boot",
  "Ray-Ban", "Oakley", "Smith Optics", "Spy Optics", "JanSport", "Eastpak",
  "Herschel Supply Co.", "Fjällräven", "Kipling", "Baggu", "Tumi", "Samsonite",
];

const vintedMercari = [
  "Reserved", "Sinsay", "House", "Mohito", "Cropp", "Stradivarius", "Pull&Bear",
  "Bershka", "Oysho", "Lefties", "Uterqüe", "Desigual", "Scotch & Soda", "G-Star",
  "Scotch and Soda", "Pepe Jeans", "Lee Cooper", "Mustang", "S.Oliver", "s.Oliver",
  "Tom Tailor", "Esprit", "C&A", "Kiabi", "Promod", "Jennyfer", "Etam", "Undiz",
  "Victoria's Secret", "Pink", "Savage X Fenty", "Aritzia", "Wilfred", "TNA",
  "Sunday Best", "Babaton", "Garage", "Dynamite", "RW&CO", "Simons", "La Senza",
  "Roots", "Lululemon", "Arc'teryx", "Mackage", "Soia & Kyo", "Aritzia",
];

const all = [
  ...athletic,
  ...streetwear,
  ...luxury,
  ...heritage,
  ...contemporary,
  ...poshmark,
  ...grailed,
  ...depopVintage,
  ...kids,
  ...europe,
  ...mallAndClassic,
  ...vintedMercari,
];

function normalize(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const byKey = new Map();
for (const raw of all) {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) continue;
  const key = normalize(name);
  if (!key) continue;
  const existing = byKey.get(key);
  if (!existing) {
    byKey.set(key, name);
    continue;
  }
  if (name.length > existing.length) byKey.set(key, name);
  else if (/[A-Z]/.test(name) && !/[A-Z]/.test(existing)) byKey.set(key, name);
}

const brands = [...byKey.values()].sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" }),
);

const brandsDir = path.join(root, "src/lib/brands");
fs.writeFileSync(
  path.join(brandsDir, "clothing-brands-data.ts"),
  `/**
 * Unified clothing brand names merged from eBay, Poshmark, Mercari, Grailed,
 * Vinted, and Depop resale catalogs. Generated by \`node scripts/generate-clothing-brands.mjs\`.
 */
export const CLOTHING_BRAND_SOURCES: readonly string[] = ${JSON.stringify(brands, null, 2)};
`,
);

fs.writeFileSync(
  path.join(brandsDir, "clothing-brands.ts"),
  `import { dedupeClothingBrandNames } from "@/lib/brands/build-clothing-brands";
import { CLOTHING_BRAND_SOURCES } from "@/lib/brands/clothing-brands-data";

/** Sorted, deduplicated clothing brands across CompStop marketplaces. */
export const CLOTHING_BRANDS: readonly string[] =
  dedupeClothingBrandNames(CLOTHING_BRAND_SOURCES);
`,
);

console.log(`Wrote ${brands.length} unique clothing brands.`);
