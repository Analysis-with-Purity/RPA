import "dotenv/config";
import { PrismaClient, Gender, DiscountType } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Image pool — a small rotating set of verified, stable Unsplash photo URLs
// (perfume bottles / fragrance & cosmetics photography). Reused across
// products so every product references known-good, working image links.
// ---------------------------------------------------------------------------
const IMG = {
  1: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80",
  2: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80",
  3: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80",
  4: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80",
  5: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=80",
  6: "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?w=800&q=80",
  7: "https://images.unsplash.com/photo-1610461888750-10bfc601b874?w=800&q=80",
  8: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80",
  9: "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=80",
  10: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&q=80",
  11: "https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80",
  12: "https://images.unsplash.com/photo-1587556930799-8dca6fad6d41?w=800&q=80",
  13: "https://images.unsplash.com/photo-1600612253971-422e7f7faeb6?w=800&q=80",
} as const;

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------
const brands = [
  { name: "Maison Verrière", slug: "maison-verriere" },
  { name: "Rêverie Noire", slug: "reverie-noire" },
  { name: "L'Atelier Doré", slug: "latelier-dore" },
  { name: "Velours House", slug: "velours-house" },
  { name: "Aurelia & Co", slug: "aurelia-and-co" },
  { name: "Château Solane", slug: "chateau-solane" },
  { name: "Lumière Privée", slug: "lumiere-privee" },
  { name: "Ombre & Santal", slug: "ombre-and-santal" },
];

// ---------------------------------------------------------------------------
// Vibes (shop-by-mood collections)
// ---------------------------------------------------------------------------
const vibes = [
  { name: "Boss Energy", slug: "boss-energy", emoji: "✨", description: "Command every room you walk into.", sortOrder: 0 },
  { name: "Date Night", slug: "date-night", emoji: "💕", description: "Scents crafted for unforgettable evenings together.", sortOrder: 1 },
  { name: "Romantic", slug: "romantic", emoji: "🌹", description: "Soft, tender florals for matters of the heart.", sortOrder: 2 },
  { name: "Fresh & Clean", slug: "fresh-and-clean", emoji: "🌊", description: "Crisp, airy scents that feel like a cold shower on a hot day.", sortOrder: 3 },
  { name: "Sexy & Seductive", slug: "sexy-and-seductive", emoji: "🔥", description: "Bold, skin-warming fragrances built to entice.", sortOrder: 4 },
  { name: "Office Ready", slug: "office-ready", emoji: "💼", description: "Polished, professional scents that never overwhelm the room.", sortOrder: 5 },
  { name: "Luxury Everyday", slug: "luxury-everyday", emoji: "👑", description: "Effortless opulence for the daily grind.", sortOrder: 6 },
  { name: "Night Out", slug: "night-out", emoji: "🌙", description: "Statement scents for the after-dark hours.", sortOrder: 7 },
  { name: "Summer Collection", slug: "summer-collection", emoji: "☀️", description: "Sun-drenched fragrances for long, golden days.", sortOrder: 8 },
  { name: "Winter Collection", slug: "winter-collection", emoji: "❄️", description: "Rich, warming scents to wrap yourself in when it's cold.", sortOrder: 9 },
];

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
type SizeSeed = { size: 30 | 50 | 100; price: number; stock: number; sku: string };

type ProductSeed = {
  name: string;
  slug: string;
  brandSlug: string;
  gender: (typeof Gender)[keyof typeof Gender];
  fragranceFamily: string;
  shortDescription: string;
  description: string;
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  longevity: string;
  projection: string;
  bestSeason: string[];
  bestOccasion: string[];
  perfectFor: string;
  images: string[];
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isSignature?: boolean;
  isLimitedEdition?: boolean;
  isGiftSet?: boolean;
  sizes: SizeSeed[];
  vibes: string[];
};

const products: ProductSeed[] = [
  // ------------------------------ Maison Verrière ------------------------------
  {
    name: "Verre de Nuit",
    slug: "verre-de-nuit",
    brandSlug: "maison-verriere",
    gender: Gender.WOMEN,
    fragranceFamily: "Floral",
    shortDescription: "A crystalline floral that glows from dusk till dawn.",
    description:
      "Verre de Nuit opens with a shimmer of pink pepper and mandarin before settling into a heart of jasmine sambac and white iris, as if moonlight had been poured into glass. The base of soft musk and ambergris lingers like a secret shared only with those closest to you. Radiant, refined, and quietly hypnotic.",
    topNotes: ["Pink Pepper", "Mandarin", "Bergamot"],
    middleNotes: ["Jasmine Sambac", "White Iris", "Orange Blossom"],
    baseNotes: ["Ambergris", "White Musk", "Sandalwood"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "Winter", "All Seasons"],
    bestOccasion: ["Date Night", "Evening/Night Out", "Special Occasion"],
    perfectFor: "The woman who prefers to arrive quietly and be remembered loudly.",
    images: [IMG[1], IMG[3]],
    isBestSeller: true,
    sizes: [
      { size: 30, price: 58000, stock: 42, sku: "MV-VDN-30" },
      { size: 50, price: 82000, stock: 30, sku: "MV-VDN-50" },
      { size: 100, price: 128000, stock: 18, sku: "MV-VDN-100" },
    ],
    vibes: ["date-night", "romantic", "night-out", "luxury-everyday"],
  },
  {
    name: "Cristal Solaire",
    slug: "cristal-solaire",
    brandSlug: "maison-verriere",
    gender: Gender.UNISEX,
    fragranceFamily: "Citrus/Fresh",
    shortDescription: "Sunlight distilled into a bottle of sparkling citrus.",
    description:
      "A burst of Sicilian bergamot and grapefruit meets cool petitgrain and a whisper of sea salt, capturing the exact moment sunrise hits glass. Cedar and soft musk settle underneath, keeping things grounded and effortlessly wearable. Built for long days and longer light.",
    topNotes: ["Bergamot", "Grapefruit", "Sea Salt Accord"],
    middleNotes: ["Petitgrain", "Neroli", "Green Mandarin"],
    baseNotes: ["Cedarwood", "White Musk"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer"],
    bestOccasion: ["Everyday", "Casual", "Office"],
    perfectFor: "Anyone who wants to smell like a good mood on a clear morning.",
    images: [IMG[4], IMG[9]],
    isGiftSet: true,
    sizes: [
      { size: 30, price: 46000, stock: 65, sku: "MV-CRS-30" },
      { size: 50, price: 68000, stock: 55, sku: "MV-CRS-50" },
      { size: 100, price: 99000, stock: 40, sku: "MV-CRS-100" },
    ],
    vibes: ["fresh-and-clean", "summer-collection", "office-ready", "luxury-everyday"],
  },
  {
    name: "Ambre Céleste",
    slug: "ambre-celeste",
    brandSlug: "maison-verriere",
    gender: Gender.WOMEN,
    fragranceFamily: "Oriental/Amber",
    shortDescription: "A warm amber embrace wrapped in golden spice.",
    description:
      "Saffron and cardamom ignite the opening before melting into a plush heart of heliotrope and cinnamon. Labdanum, vanilla, and tonka bean close the fragrance in a slow, honeyed warmth that feels like velvet against the skin. Not a scent you wear — one you sink into.",
    topNotes: ["Saffron", "Cardamom", "Blood Orange"],
    middleNotes: ["Heliotrope", "Cinnamon", "Davana"],
    baseNotes: ["Labdanum", "Vanilla", "Tonka Bean"],
    longevity: "10-12+ hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Evening/Night Out", "Special Occasion"],
    perfectFor: "The woman who wants to be remembered long after she's left the room.",
    images: [IMG[2], IMG[6]],
    isSignature: true,
    sizes: [
      { size: 30, price: 62000, stock: 25, sku: "MV-AMC-30" },
      { size: 50, price: 89000, stock: 20, sku: "MV-AMC-50" },
      { size: 100, price: 138000, stock: 12, sku: "MV-AMC-100" },
    ],
    vibes: ["sexy-and-seductive", "winter-collection", "night-out", "luxury-everyday"],
  },
  {
    name: "Jardin Secret",
    slug: "jardin-secret",
    brandSlug: "maison-verriere",
    gender: Gender.WOMEN,
    fragranceFamily: "Floral",
    shortDescription: "A hidden garden captured mid-bloom.",
    description:
      "Green galbanum and dewy violet leaf open onto a lush bouquet of tuberose, magnolia, and lily of the valley — the kind of floral heart that feels alive rather than powdery. A quiet base of oakmoss and soft musk keeps the whole composition grounded in shade rather than sun. Delicate, but never fragile.",
    topNotes: ["Violet Leaf", "Galbanum", "Green Mandarin"],
    middleNotes: ["Tuberose", "Magnolia", "Lily of the Valley"],
    baseNotes: ["Oakmoss", "White Musk", "Ambrette Seed"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer"],
    bestOccasion: ["Everyday", "Date Night", "Casual"],
    perfectFor: "Someone drawn to gardens more than bouquets — natural, unforced beauty.",
    images: [IMG[5], IMG[11]],
    isNewArrival: true,
    sizes: [
      { size: 30, price: 47000, stock: 70, sku: "MV-JDS-30" },
      { size: 50, price: 69000, stock: 48, sku: "MV-JDS-50" },
      { size: 100, price: 101000, stock: 22, sku: "MV-JDS-100" },
    ],
    vibes: ["romantic", "fresh-and-clean", "summer-collection"],
  },

  // ------------------------------ Rêverie Noire ------------------------------
  {
    name: "Nuit Interdite",
    slug: "nuit-interdite",
    brandSlug: "reverie-noire",
    gender: Gender.WOMEN,
    fragranceFamily: "Oriental/Amber",
    shortDescription: "The scent of a rule you're about to break.",
    description:
      "Dark plum and black currant spill into a smoky heart of black orchid and spice, before a base of oud, patchouli, and warm amber takes hold. Nuit Interdite doesn't ask for attention — it takes it, slowly and on its own terms. This is a fragrance built for the hours after midnight.",
    topNotes: ["Black Currant", "Dark Plum", "Pink Pepper"],
    middleNotes: ["Black Orchid", "Cinnamon", "Clove"],
    baseNotes: ["Oud", "Patchouli", "Amber"],
    longevity: "10-12+ hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Evening/Night Out", "Special Occasion", "Date Night"],
    perfectFor: "The woman who wears confidence like a second skin after dark.",
    images: [IMG[6], IMG[2]],
    sizes: [
      { size: 30, price: 60000, stock: 35, sku: "RN-NIT-30" },
      { size: 50, price: 86000, stock: 24, sku: "RN-NIT-50" },
      { size: 100, price: 134000, stock: 15, sku: "RN-NIT-100" },
    ],
    vibes: ["sexy-and-seductive", "night-out", "winter-collection"],
  },
  {
    name: "Cuir Sombre",
    slug: "cuir-sombre",
    brandSlug: "reverie-noire",
    gender: Gender.MEN,
    fragranceFamily: "Leather",
    shortDescription: "Dark leather, distilled into confidence.",
    description:
      "Smoked birch and black pepper open Cuir Sombre with a jolt, leading into a heart wrapped tight in supple leather and dry tobacco leaf. Vetiver and cedar close things out, dry and assertive, like a well-worn jacket that's earned its creases. Understated power, worn close to the skin.",
    topNotes: ["Black Pepper", "Smoked Birch", "Cardamom"],
    middleNotes: ["Leather", "Tobacco Leaf", "Nutmeg"],
    baseNotes: ["Vetiver", "Cedarwood", "Amber"],
    longevity: "10-12+ hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Evening/Night Out", "Special Occasion"],
    perfectFor: "The man who lets his fragrance do the talking he won't.",
    images: [IMG[7], IMG[5]],
    isBestSeller: true,
    sizes: [
      { size: 30, price: 56000, stock: 60, sku: "RN-CUS-30" },
      { size: 50, price: 80000, stock: 45, sku: "RN-CUS-50" },
      { size: 100, price: 122000, stock: 28, sku: "RN-CUS-100" },
    ],
    vibes: ["boss-energy", "night-out", "winter-collection", "luxury-everyday"],
  },
  {
    name: "Velours Noir",
    slug: "velours-noir",
    brandSlug: "reverie-noire",
    gender: Gender.UNISEX,
    fragranceFamily: "Woody",
    shortDescription: "Woody depth wrapped in dark velvet softness.",
    description:
      "Velours Noir moves quietly from bitter orange and elemi into a heart of iris and violet, before settling into a long, resinous base of guaiac wood, patchouli, and soft leather. It reads differently on everyone who wears it — which is exactly the point. A unisex signature built on texture rather than volume.",
    topNotes: ["Elemi", "Bitter Orange", "Pink Pepper"],
    middleNotes: ["Iris", "Violet", "Nutmeg"],
    baseNotes: ["Guaiac Wood", "Patchouli", "Soft Leather"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "Winter", "All Seasons"],
    bestOccasion: ["Office", "Evening/Night Out", "Everyday"],
    perfectFor: "Someone who wants their scent to feel like a fabric, not a statement.",
    images: [IMG[8], IMG[10]],
    sizes: [
      { size: 30, price: 52000, stock: 50, sku: "RN-VLN-30" },
      { size: 50, price: 74000, stock: 38, sku: "RN-VLN-50" },
      { size: 100, price: 112000, stock: 20, sku: "RN-VLN-100" },
    ],
    vibes: ["luxury-everyday", "office-ready", "winter-collection"],
  },

  // ------------------------------ L'Atelier Doré ------------------------------
  {
    name: "Or Absolu",
    slug: "or-absolu",
    brandSlug: "latelier-dore",
    gender: Gender.UNISEX,
    fragranceFamily: "Oriental/Amber",
    shortDescription: "Liquid gold, poured into its rarest form.",
    description:
      "Or Absolu is L'Atelier Doré's most closely guarded formula — a rare accord of oud and saffron threaded through with rose and warm spice, finished in a base so dense with amber and ambergris it feels almost architectural. Produced in small batches, it is less a fragrance than a private ritual. Wear it when the moment calls for something irreplaceable.",
    topNotes: ["Saffron", "Pink Pepper", "Bergamot"],
    middleNotes: ["Rose de Mai", "Oud", "Cinnamon"],
    baseNotes: ["Amber", "Ambergris", "Sandalwood"],
    longevity: "10-12+ hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter", "All Seasons"],
    bestOccasion: ["Special Occasion", "Evening/Night Out"],
    perfectFor: "Collectors and connoisseurs who want a fragrance as rare as the occasion.",
    images: [IMG[1], IMG[6], IMG[2]],
    isSignature: true,
    isLimitedEdition: true,
    sizes: [
      { size: 30, price: 78000, stock: 3, sku: "LAD-ORA-30" },
      { size: 50, price: 112000, stock: 14, sku: "LAD-ORA-50" },
      { size: 100, price: 178000, stock: 8, sku: "LAD-ORA-100" },
    ],
    vibes: ["luxury-everyday", "night-out", "winter-collection", "sexy-and-seductive"],
  },
  {
    name: "Boisé Royal",
    slug: "boise-royal",
    brandSlug: "latelier-dore",
    gender: Gender.MEN,
    fragranceFamily: "Woody",
    shortDescription: "A regal woody signature built for command.",
    description:
      "Boisé Royal opens crisp with juniper and grapefruit zest, then folds into a heart of cypress and iris before resting on a base of sandalwood, vetiver, and cedar. It's the fragrance equivalent of a well-tailored suit — structured, composed, and unmistakably in charge.",
    topNotes: ["Juniper", "Grapefruit", "Cardamom"],
    middleNotes: ["Cypress", "Iris", "Sage"],
    baseNotes: ["Sandalwood", "Vetiver", "Cedarwood"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["All Seasons"],
    bestOccasion: ["Office", "Everyday", "Special Occasion"],
    perfectFor: "The man whose presence enters a room a beat before he does.",
    images: [IMG[3], IMG[9]],
    isBestSeller: true,
    sizes: [
      { size: 30, price: 54000, stock: 55, sku: "LAD-BRY-30" },
      { size: 50, price: 77000, stock: 40, sku: "LAD-BRY-50" },
      { size: 100, price: 118000, stock: 26, sku: "LAD-BRY-100" },
    ],
    vibes: ["boss-energy", "office-ready", "luxury-everyday"],
  },
  {
    name: "Fleur d'Or",
    slug: "fleur-dor",
    brandSlug: "latelier-dore",
    gender: Gender.WOMEN,
    fragranceFamily: "Floral",
    shortDescription: "A golden bouquet, dressed for celebration.",
    description:
      "Mandarin and neroli give way to an opulent heart of golden rose, ylang-ylang, and orange blossom, finished with a soft trail of vanilla and white musk. Fleur d'Or is presented in a gilded box designed for gifting — though most who receive it never want to give the bottle back.",
    topNotes: ["Mandarin", "Neroli", "Bergamot"],
    middleNotes: ["Golden Rose", "Ylang-Ylang", "Orange Blossom"],
    baseNotes: ["Vanilla", "White Musk", "Benzoin"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer", "All Seasons"],
    bestOccasion: ["Special Occasion", "Date Night", "Everyday"],
    perfectFor: "The woman who deserves flowers and would rather wear them.",
    images: [IMG[11], IMG[4]],
    isGiftSet: true,
    sizes: [
      { size: 30, price: 50000, stock: 45, sku: "LAD-FDO-30" },
      { size: 50, price: 72000, stock: 35, sku: "LAD-FDO-50" },
      { size: 100, price: 108000, stock: 20, sku: "LAD-FDO-100" },
    ],
    vibes: ["romantic", "date-night", "luxury-everyday"],
  },
  {
    name: "Vetiver Doré",
    slug: "vetiver-dore",
    brandSlug: "latelier-dore",
    gender: Gender.MEN,
    fragranceFamily: "Aromatic",
    shortDescription: "Golden vetiver with an aromatic, sunlit edge.",
    description:
      "A newcomer to the house, Vetiver Doré pairs bright bergamot and rosemary with a dry, earthy heart of vetiver and clary sage. Amber and tonka bean warm the finish just enough to keep it from feeling austere. Clean, confident, and endlessly wearable.",
    topNotes: ["Bergamot", "Rosemary", "Lemon"],
    middleNotes: ["Vetiver", "Clary Sage", "Geranium"],
    baseNotes: ["Amber", "Tonka Bean", "Cedarwood"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer"],
    bestOccasion: ["Office", "Everyday", "Casual"],
    perfectFor: "Someone who wants effortless polish without any heaviness.",
    images: [IMG[9], IMG[7]],
    isNewArrival: true,
    sizes: [
      { size: 30, price: 47000, stock: 62, sku: "LAD-VTD-30" },
      { size: 50, price: 68000, stock: 50, sku: "LAD-VTD-50" },
      { size: 100, price: 99000, stock: 30, sku: "LAD-VTD-100" },
    ],
    vibes: ["fresh-and-clean", "office-ready", "summer-collection"],
  },

  // ------------------------------ Velours House ------------------------------
  {
    name: "Velours Homme",
    slug: "velours-homme",
    brandSlug: "velours-house",
    gender: Gender.MEN,
    fragranceFamily: "Woody",
    shortDescription: "The house signature, cast entirely in wood and warmth.",
    description:
      "Velours Homme is built around a core of sandalwood and cashmere musk, opened by a spark of bergamot and pink pepper. Its middle notes of iris and suede lend it a tactile softness rarely found in woody compositions this rich. This is the scent Velours House built its name on.",
    topNotes: ["Bergamot", "Pink Pepper", "Cardamom"],
    middleNotes: ["Iris", "Suede Accord", "Nutmeg"],
    baseNotes: ["Sandalwood", "Cashmere Musk", "Amber"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "Winter", "All Seasons"],
    bestOccasion: ["Office", "Evening/Night Out", "Everyday"],
    perfectFor: "The man building a signature scent people associate only with him.",
    images: [IMG[5], IMG[8]],
    isSignature: true,
    sizes: [
      { size: 30, price: 55000, stock: 48, sku: "VH-VLH-30" },
      { size: 50, price: 79000, stock: 38, sku: "VH-VLH-50" },
      { size: 100, price: 120000, stock: 22, sku: "VH-VLH-100" },
    ],
    vibes: ["luxury-everyday", "boss-energy", "winter-collection"],
  },
  {
    name: "Soie Rouge",
    slug: "soie-rouge",
    brandSlug: "velours-house",
    gender: Gender.WOMEN,
    fragranceFamily: "Floral",
    shortDescription: "Red silk, poured into a bottle.",
    description:
      "Soie Rouge drapes raspberry and rose absolute over a warm base of amber and vanilla musk, with a heartbeat of jasmine keeping it from ever feeling too sweet. It moves the way silk does — fluid, deliberate, impossible to ignore in the right light.",
    topNotes: ["Raspberry", "Pink Pepper", "Bergamot"],
    middleNotes: ["Rose Absolute", "Jasmine Sambac", "Cinnamon"],
    baseNotes: ["Amber", "Vanilla", "Musk"],
    longevity: "8-10 hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Date Night", "Evening/Night Out", "Special Occasion"],
    perfectFor: "A woman who treats every dinner like it might become a memory.",
    images: [IMG[2], IMG[11]],
    sizes: [
      { size: 30, price: 57000, stock: 40, sku: "VH-SGR-30" },
      { size: 50, price: 82000, stock: 30, sku: "VH-SGR-50" },
      { size: 100, price: 126000, stock: 16, sku: "VH-SGR-100" },
    ],
    vibes: ["date-night", "romantic", "sexy-and-seductive", "night-out"],
  },
  {
    name: "Tabac & Miel",
    slug: "tabac-et-miel",
    brandSlug: "velours-house",
    gender: Gender.MEN,
    fragranceFamily: "Gourmand",
    shortDescription: "Tobacco and honey, aged like a fine reserve.",
    description:
      "Released in limited quantities each year, Tabac & Miel steeps dried tobacco leaf in honey and rum absolute, laid over a base of tonka bean and dark patchouli. It's a fragrance with the density of a good whiskey — sip-worthy, not splashed on lightly.",
    topNotes: ["Rum Absolute", "Bergamot", "Clove"],
    middleNotes: ["Tobacco Leaf", "Honey", "Cinnamon"],
    baseNotes: ["Tonka Bean", "Patchouli", "Vanilla"],
    longevity: "10-12+ hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Evening/Night Out", "Special Occasion"],
    perfectFor: "The man who wants his fragrance to taste like his favorite evening.",
    images: [IMG[6], IMG[10]],
    isLimitedEdition: true,
    sizes: [
      { size: 50, price: 98000, stock: 20, sku: "VH-TBM-50" },
      { size: 100, price: 155000, stock: 12, sku: "VH-TBM-100" },
    ],
    vibes: ["sexy-and-seductive", "winter-collection", "night-out"],
  },

  // ------------------------------ Aurelia & Co ------------------------------
  {
    name: "Aurelia Blanche",
    slug: "aurelia-blanche",
    brandSlug: "aurelia-and-co",
    gender: Gender.WOMEN,
    fragranceFamily: "Floral",
    shortDescription: "The house's whitest, purest floral, bottled in light.",
    description:
      "Aurelia Blanche opens with dewy neroli and a whisper of green tea before unfurling into lily of the valley and white peony. A clean base of musk and soft cedar keeps the entire composition feeling washed in daylight rather than heavy florals. It has become the house's most requested creation for good reason.",
    topNotes: ["Neroli", "Green Tea", "Bergamot"],
    middleNotes: ["Lily of the Valley", "White Peony", "Freesia"],
    baseNotes: ["White Musk", "Cedarwood", "Ambrette Seed"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer", "All Seasons"],
    bestOccasion: ["Office", "Everyday", "Casual"],
    perfectFor: "Someone who wants florals that read as clean confidence, not perfume counter.",
    images: [IMG[4], IMG[9]],
    isBestSeller: true,
    sizes: [
      { size: 30, price: 46000, stock: 75, sku: "AC-ABL-30" },
      { size: 50, price: 66000, stock: 58, sku: "AC-ABL-50" },
      { size: 100, price: 97000, stock: 35, sku: "AC-ABL-100" },
    ],
    vibes: ["fresh-and-clean", "office-ready", "luxury-everyday", "summer-collection"],
  },
  {
    name: "Golden Hour",
    slug: "golden-hour",
    brandSlug: "aurelia-and-co",
    gender: Gender.UNISEX,
    fragranceFamily: "Gourmand",
    shortDescription: "The last light of day, captured in warm sugar and wood.",
    description:
      "Golden Hour blends caramelized fig and toasted almond with a soft floral heart of osmanthus, before resting on sandalwood and tonka bean. It's warm without being cloying — the exact temperature of late afternoon sun. A house signature meant to be worn by anyone drawn to gentle, golden warmth.",
    topNotes: ["Fig", "Toasted Almond", "Mandarin"],
    middleNotes: ["Osmanthus", "Heliotrope", "Davana"],
    baseNotes: ["Sandalwood", "Tonka Bean", "Vanilla"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "All Seasons"],
    bestOccasion: ["Everyday", "Date Night", "Casual"],
    perfectFor: "Anyone who wants their fragrance to feel like a favorite memory.",
    images: [IMG[10], IMG[1]],
    isSignature: true,
    sizes: [
      { size: 30, price: 53000, stock: 44, sku: "AC-GLH-30" },
      { size: 50, price: 76000, stock: 33, sku: "AC-GLH-50" },
      { size: 100, price: 116000, stock: 19, sku: "AC-GLH-100" },
    ],
    vibes: ["luxury-everyday", "romantic", "summer-collection"],
  },
  {
    name: "Citron d'Aurelia",
    slug: "citron-daurelia",
    brandSlug: "aurelia-and-co",
    gender: Gender.UNISEX,
    fragranceFamily: "Citrus/Fresh",
    shortDescription: "Sicilian citrus, sharpened by cool green herbs.",
    description:
      "This season's newest arrival, Citron d'Aurelia pairs bright lemon and yuzu with basil and mint for a fragrance that feels almost carbonated. A light musk and vetiver base ensures it never turns thin, keeping the freshness anchored through the day.",
    topNotes: ["Lemon", "Yuzu", "Mint"],
    middleNotes: ["Basil", "Green Mandarin", "Petitgrain"],
    baseNotes: ["Vetiver", "White Musk"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer"],
    bestOccasion: ["Everyday", "Casual", "Office"],
    perfectFor: "Someone who wants their signature scent to feel like a cold drink on a hot day.",
    images: [IMG[9], IMG[4]],
    isNewArrival: true,
    sizes: [
      { size: 30, price: 44000, stock: 80, sku: "AC-CTD-30" },
      { size: 50, price: 64000, stock: 60, sku: "AC-CTD-50" },
      { size: 100, price: 94000, stock: 42, sku: "AC-CTD-100" },
    ],
    vibes: ["fresh-and-clean", "summer-collection", "office-ready"],
  },
  {
    name: "Noble Oud",
    slug: "noble-oud",
    brandSlug: "aurelia-and-co",
    gender: Gender.MEN,
    fragranceFamily: "Oriental/Amber",
    shortDescription: "An heirloom oud, aged and released in small runs.",
    description:
      "Noble Oud is Aurelia & Co's rare foray into pure oriental territory — a dense, resinous accord of aged oud and rose held together by smoky incense and dark amber. Only a limited run is produced each year, and it disappears from shelves quickly. Reserved for those who wear their fragrance like an heirloom.",
    topNotes: ["Saffron", "Rose", "Black Pepper"],
    middleNotes: ["Oud", "Incense", "Cinnamon"],
    baseNotes: ["Amber", "Patchouli", "Leather"],
    longevity: "10-12+ hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Special Occasion", "Evening/Night Out"],
    perfectFor: "The collector who wants a fragrance with real gravity.",
    images: [IMG[6], IMG[2]],
    isLimitedEdition: true,
    sizes: [
      { size: 30, price: 72000, stock: 4, sku: "AC-NBO-30" },
      { size: 50, price: 104000, stock: 2, sku: "AC-NBO-50" },
      { size: 100, price: 168000, stock: 9, sku: "AC-NBO-100" },
    ],
    vibes: ["boss-energy", "night-out", "winter-collection", "sexy-and-seductive"],
  },

  // ------------------------------ Château Solane ------------------------------
  {
    name: "Domaine Boisé",
    slug: "domaine-boise",
    brandSlug: "chateau-solane",
    gender: Gender.MEN,
    fragranceFamily: "Chypre",
    shortDescription: "An estate-grown woody chypre, aged like a fine vintage.",
    description:
      "Domaine Boisé opens with bergamot and clary sage before descending into a dry, mossy heart of oakmoss and geranium. Vetiver, patchouli, and leather close it out with the quiet weight of an old library. It is Château Solane's most decorated creation, and it wears the part.",
    topNotes: ["Bergamot", "Clary Sage", "Lemon"],
    middleNotes: ["Oakmoss", "Geranium", "Iris"],
    baseNotes: ["Vetiver", "Patchouli", "Leather"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "Winter", "All Seasons"],
    bestOccasion: ["Office", "Special Occasion", "Everyday"],
    perfectFor: "The man whose fragrance should feel inherited, not purchased.",
    images: [IMG[3], IMG[7]],
    isBestSeller: true,
    sizes: [
      { size: 30, price: 59000, stock: 46, sku: "CS-DMB-30" },
      { size: 50, price: 84000, stock: 34, sku: "CS-DMB-50" },
      { size: 100, price: 130000, stock: 20, sku: "CS-DMB-100" },
    ],
    vibes: ["boss-energy", "office-ready", "winter-collection", "luxury-everyday"],
  },
  {
    name: "Vigne Sauvage",
    slug: "vigne-sauvage",
    brandSlug: "chateau-solane",
    gender: Gender.UNISEX,
    fragranceFamily: "Aromatic",
    shortDescription: "Wild vines and green herbs, harvested at dusk.",
    description:
      "A small-batch release inspired by the château's own vineyards, Vigne Sauvage opens with crushed green grape leaf and juniper before a heart of rosemary, thyme, and sage takes hold. Oakmoss and cedar round out a fragrance that smells unmistakably of the outdoors after rain.",
    topNotes: ["Green Grape Leaf", "Juniper", "Bergamot"],
    middleNotes: ["Rosemary", "Thyme", "Sage"],
    baseNotes: ["Oakmoss", "Cedarwood", "Vetiver"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Autumn"],
    bestOccasion: ["Casual", "Everyday"],
    perfectFor: "Someone drawn to green, herbal scents that feel unmistakably natural.",
    images: [IMG[7], IMG[9]],
    isLimitedEdition: true,
    sizes: [
      { size: 30, price: 51000, stock: 30, sku: "CS-VGS-30" },
      { size: 50, price: 73000, stock: 15, sku: "CS-VGS-50" },
      { size: 100, price: 108000, stock: 0, sku: "CS-VGS-100" },
    ],
    vibes: ["fresh-and-clean", "luxury-everyday"],
  },
  {
    name: "Rosé Nocturne",
    slug: "rose-nocturne",
    brandSlug: "chateau-solane",
    gender: Gender.WOMEN,
    fragranceFamily: "Chypre",
    shortDescription: "A midnight rose, cut with dark, mossy depth.",
    description:
      "Rosé Nocturne pairs a full-bodied rose absolute with black currant and pink pepper, before settling into a chypre base of oakmoss, patchouli, and soft leather. Newly released this season, it reinterprets the classic rose chypre with a darker, more nocturnal edge. Elegant, but with teeth.",
    topNotes: ["Black Currant", "Pink Pepper", "Bergamot"],
    middleNotes: ["Rose Absolute", "Geranium", "Violet"],
    baseNotes: ["Oakmoss", "Patchouli", "Leather"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Evening/Night Out", "Date Night", "Special Occasion"],
    perfectFor: "A woman who wants romance with a little bit of danger in it.",
    images: [IMG[2], IMG[5]],
    isNewArrival: true,
    sizes: [
      { size: 30, price: 58000, stock: 38, sku: "CS-RSN-30" },
      { size: 50, price: 83000, stock: 26, sku: "CS-RSN-50" },
      { size: 100, price: 129000, stock: 14, sku: "CS-RSN-100" },
    ],
    vibes: ["date-night", "night-out", "sexy-and-seductive", "winter-collection"],
  },

  // ------------------------------ Lumière Privée ------------------------------
  {
    name: "Lumière Blanche",
    slug: "lumiere-blanche",
    brandSlug: "lumiere-privee",
    gender: Gender.WOMEN,
    fragranceFamily: "Aquatic",
    shortDescription: "White light on water, distilled into scent.",
    description:
      "The house's signature aquatic, Lumière Blanche opens on dewy water lily and ozonic accord before drifting into a soft floral heart of jasmine and muguet. A clean, transparent base of white musk and driftwood keeps it feeling like light rather than weight. Effortless from the very first spray.",
    topNotes: ["Water Lily", "Ozonic Accord", "Bergamot"],
    middleNotes: ["Jasmine", "Muguet", "Lotus Flower"],
    baseNotes: ["White Musk", "Driftwood Accord", "Ambrette Seed"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer", "All Seasons"],
    bestOccasion: ["Everyday", "Office", "Casual"],
    perfectFor: "Someone who wants their fragrance to feel like clean air, not perfume.",
    images: [IMG[4], IMG[11]],
    isSignature: true,
    sizes: [
      { size: 30, price: 49000, stock: 68, sku: "LP-LMB-30" },
      { size: 50, price: 71000, stock: 52, sku: "LP-LMB-50" },
      { size: 100, price: 106000, stock: 30, sku: "LP-LMB-100" },
    ],
    vibes: ["fresh-and-clean", "office-ready", "summer-collection"],
  },
  {
    name: "Ombre Discrète",
    slug: "ombre-discrete",
    brandSlug: "lumiere-privee",
    gender: Gender.MEN,
    fragranceFamily: "Leather",
    shortDescription: "A discreet shadow of leather and smoke.",
    description:
      "Ombre Discrète is built for restraint — a quiet accord of birch tar and leather softened by iris and vetiver, worn close to the skin rather than projected outward. Produced in a limited run each year, it rewards those who prefer to be discovered rather than announced.",
    topNotes: ["Birch Tar", "Black Pepper", "Bergamot"],
    middleNotes: ["Iris", "Leather", "Nutmeg"],
    baseNotes: ["Vetiver", "Cedarwood", "Musk"],
    longevity: "8-10 hours",
    projection: "Intimate / Skin Scent",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Office", "Everyday", "Evening/Night Out"],
    perfectFor: "The man who prefers his fragrance to be discovered up close, not from across the room.",
    images: [IMG[8], IMG[7]],
    isLimitedEdition: true,
    sizes: [
      { size: 30, price: 61000, stock: 0, sku: "LP-OMD-30" },
      { size: 50, price: 87000, stock: 18, sku: "LP-OMD-50" },
      { size: 100, price: 136000, stock: 10, sku: "LP-OMD-100" },
    ],
    vibes: ["office-ready", "luxury-everyday", "winter-collection"],
  },
  {
    name: "Secret Doré",
    slug: "secret-dore",
    brandSlug: "lumiere-privee",
    gender: Gender.WOMEN,
    fragranceFamily: "Oriental/Amber",
    shortDescription: "A gilded secret, wrapped for the one who deserves it.",
    description:
      "Secret Doré wraps apricot and honeyed osmanthus around a warm amber and vanilla base, finished with a trace of sandalwood. Presented in a gold-foiled gift box, it was designed as much for giving as for wearing — though it rarely leaves its new owner's dressing table for long.",
    topNotes: ["Apricot", "Mandarin", "Pink Pepper"],
    middleNotes: ["Osmanthus", "Honey Accord", "Jasmine"],
    baseNotes: ["Amber", "Vanilla", "Sandalwood"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "Winter", "All Seasons"],
    bestOccasion: ["Special Occasion", "Date Night", "Everyday"],
    perfectFor: "The woman who deserves to be given something as rich as she is.",
    images: [IMG[1], IMG[10]],
    isNewArrival: true,
    isGiftSet: true,
    sizes: [
      { size: 30, price: 56000, stock: 40, sku: "LP-SCD-30" },
      { size: 50, price: 80000, stock: 28, sku: "LP-SCD-50" },
      { size: 100, price: 124000, stock: 15, sku: "LP-SCD-100" },
    ],
    vibes: ["romantic", "date-night", "luxury-everyday", "winter-collection"],
  },
  {
    name: "Aqua Privée",
    slug: "aqua-privee",
    brandSlug: "lumiere-privee",
    gender: Gender.MEN,
    fragranceFamily: "Aquatic",
    shortDescription: "A private reserve of cool, mineral freshness.",
    description:
      "Aqua Privée channels sea spray and crushed mint into a heart of fig leaf and lavender, before a mineral-cool base of ambroxan and driftwood settles in. Released in limited numbers, it captures the specific chill of early morning ocean air.",
    topNotes: ["Sea Spray Accord", "Mint", "Bergamot"],
    middleNotes: ["Fig Leaf", "Lavender", "Rosemary"],
    baseNotes: ["Ambroxan", "Driftwood Accord", "Musk"],
    longevity: "6-8 hours",
    projection: "Moderate",
    bestSeason: ["Spring", "Summer"],
    bestOccasion: ["Everyday", "Casual", "Office"],
    perfectFor: "The man who wants to smell like the coastline at 6am.",
    images: [IMG[9], IMG[5]],
    isLimitedEdition: true,
    sizes: [
      { size: 30, price: 52000, stock: 36, sku: "LP-AQP-30" },
      { size: 50, price: 75000, stock: 24, sku: "LP-AQP-50" },
      { size: 100, price: 114000, stock: 12, sku: "LP-AQP-100" },
    ],
    vibes: ["fresh-and-clean", "summer-collection", "office-ready"],
  },

  // ------------------------------ Ombre & Santal ------------------------------
  {
    name: "Santal Impérial",
    slug: "santal-imperial",
    brandSlug: "ombre-and-santal",
    gender: Gender.MEN,
    fragranceFamily: "Woody",
    shortDescription: "The house's flagship sandalwood, cast in imperial scale.",
    description:
      "Santal Impérial builds from cardamom and bergamot into an enormous heart of creamy sandalwood, rose, and iris, before resting on a base thick with amber and musk. It is the fragrance Ombre & Santal was founded to make, and remains its most awarded creation to date.",
    topNotes: ["Cardamom", "Bergamot", "Pink Pepper"],
    middleNotes: ["Sandalwood", "Rose", "Iris"],
    baseNotes: ["Amber", "Musk", "Cedarwood"],
    longevity: "10-12+ hours",
    projection: "Strong",
    bestSeason: ["Autumn", "Winter", "All Seasons"],
    bestOccasion: ["Special Occasion", "Office", "Everyday"],
    perfectFor: "The man who wants his signature scent to feel monumental.",
    images: [IMG[3], IMG[6]],
    isBestSeller: true,
    sizes: [
      { size: 30, price: 60000, stock: 50, sku: "OS-STI-30" },
      { size: 50, price: 86000, stock: 32, sku: "OS-STI-50" },
      { size: 100, price: 132000, stock: 4, sku: "OS-STI-100" },
    ],
    vibes: ["boss-energy", "luxury-everyday", "winter-collection"],
  },
  {
    name: "Musc Éternel",
    slug: "musc-eternel",
    brandSlug: "ombre-and-santal",
    gender: Gender.UNISEX,
    fragranceFamily: "Musk",
    shortDescription: "An eternal musk, soft enough to wear like skin.",
    description:
      "Musc Éternel strips fragrance back to its most essential form — layers of white musk built up slowly over a whisper of iris and ambrette seed, with only the faintest trace of citrus at the top. It is the house's answer to those who want to smell clean, warm, and simply like themselves, only more so.",
    topNotes: ["Bergamot", "Ambrette Seed", "Pink Pepper"],
    middleNotes: ["Iris", "White Musk", "Violet"],
    baseNotes: ["Musk", "Sandalwood", "Cedarwood"],
    longevity: "8-10 hours",
    projection: "Intimate / Skin Scent",
    bestSeason: ["All Seasons"],
    bestOccasion: ["Everyday", "Office", "Casual"],
    perfectFor: "Anyone who wants their fragrance mistaken for their own natural scent, just better.",
    images: [IMG[8], IMG[4]],
    isSignature: true,
    sizes: [
      { size: 30, price: 50000, stock: 55, sku: "OS-MSE-30" },
      { size: 50, price: 72000, stock: 40, sku: "OS-MSE-50" },
      { size: 100, price: 110000, stock: 24, sku: "OS-MSE-100" },
    ],
    vibes: ["fresh-and-clean", "luxury-everyday", "office-ready"],
  },
  {
    name: "Nuit de Santal",
    slug: "nuit-de-santal",
    brandSlug: "ombre-and-santal",
    gender: Gender.WOMEN,
    fragranceFamily: "Oriental/Amber",
    shortDescription: "Sandalwood after dark, softened by rose and smoke.",
    description:
      "Nuit de Santal is Ombre & Santal's newest release for women — a warm braid of sandalwood and rose set against a smoky base of incense and vanilla. It reads darker and more intimate than the brand's classic woods, built specifically for evenings that run late.",
    topNotes: ["Rose", "Pink Pepper", "Bergamot"],
    middleNotes: ["Sandalwood", "Incense", "Cinnamon"],
    baseNotes: ["Vanilla", "Amber", "Musk"],
    longevity: "8-10 hours",
    projection: "Moderate to Strong",
    bestSeason: ["Autumn", "Winter"],
    bestOccasion: ["Evening/Night Out", "Date Night", "Special Occasion"],
    perfectFor: "A woman whose evenings deserve a scent with real depth.",
    images: [IMG[6], IMG[1]],
    isNewArrival: true,
    sizes: [
      { size: 30, price: 57000, stock: 42, sku: "OS-NDS-30" },
      { size: 50, price: 81000, stock: 30, sku: "OS-NDS-50" },
      { size: 100, price: 127000, stock: 16, sku: "OS-NDS-100" },
    ],
    vibes: ["night-out", "date-night", "winter-collection", "sexy-and-seductive"],
  },
];

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------
type BundleSeed = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  image: string;
  discountType: (typeof DiscountType)[keyof typeof DiscountType];
  discountValue: number;
  active: boolean;
  items: { productSlug: string; quantity?: number }[];
};

const bundles: BundleSeed[] = [
  {
    name: "Date Night Combo",
    slug: "date-night-combo",
    tagline: "A romantic pairing designed to leave a lasting impression.",
    description:
      "Two signature scents made for the two of you — Nuit Interdite's smoky amber for her, and Cuir Sombre's dark leather for him. Together, they create the kind of shared memory only great fragrance can hold onto.",
    image: IMG[2],
    discountType: DiscountType.PERCENT,
    discountValue: 15,
    active: true,
    items: [{ productSlug: "nuit-interdite" }, { productSlug: "cuir-sombre" }],
  },
  {
    name: "Office Elegance Combo",
    slug: "office-elegance-combo",
    tagline: "Polished fragrance for the professional who never overdresses.",
    description:
      "Boisé Royal and Lumière Blanche were built for the boardroom — structured, clean, and confident without ever crossing into loud. This pairing keeps you polished from the morning commute through the evening's last meeting.",
    image: IMG[9],
    discountType: DiscountType.PERCENT,
    discountValue: 12,
    active: true,
    items: [{ productSlug: "boise-royal" }, { productSlug: "lumiere-blanche" }],
  },
  {
    name: "Boss Energy Combo",
    slug: "boss-energy-combo",
    tagline: "Two commanding signatures for the room you're about to walk into.",
    description:
      "Santal Impérial and Domaine Boisé are Ombre & Santal and Château Solane's most decorated creations — rich, resinous, and built to be remembered. This combo is for the days when quiet confidence isn't enough.",
    image: IMG[3],
    discountType: DiscountType.PERCENT,
    discountValue: 18,
    active: true,
    items: [{ productSlug: "santal-imperial" }, { productSlug: "domaine-boise" }],
  },
  {
    name: "Fresh Everyday Combo",
    slug: "fresh-everyday-combo",
    tagline: "Clean, radiant scents for every day of the week.",
    description:
      "Citron d'Aurelia and Cristal Solaire trade in sparkling citrus and crisp musk, layering effortlessly for warm-weather wear. A combo built for daily rotation, not special occasions.",
    image: IMG[4],
    discountType: DiscountType.PERCENT,
    discountValue: 10,
    active: true,
    items: [{ productSlug: "citron-daurelia" }, { productSlug: "cristal-solaire" }],
  },
  {
    name: "Luxury Starter Pack",
    slug: "luxury-starter-pack",
    tagline: "The perfect introduction to premium fragrance, curated in three.",
    description:
      "For anyone stepping into luxury perfumery for the first time, this trio pairs Aurelia Blanche's clean florals, Vetiver Doré's aromatic freshness, and Musc Éternel's skin-close warmth. Three completely different fragrance families, one unmistakable step up in quality.",
    image: IMG[10],
    discountType: DiscountType.PERCENT,
    discountValue: 20,
    active: true,
    items: [
      { productSlug: "aurelia-blanche" },
      { productSlug: "vetiver-dore" },
      { productSlug: "musc-eternel" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------
const promoCodes = [
  { code: "WELCOME10", discountType: DiscountType.PERCENT, discountValue: 10, active: true },
  { code: "LUXE20", discountType: DiscountType.PERCENT, discountValue: 20, active: true },
  { code: "FREESHIP", discountType: DiscountType.FIXED, discountValue: 2500, active: true },
];

// ---------------------------------------------------------------------------
// Seed logic
// ---------------------------------------------------------------------------
async function main() {
  console.log("Seeding brands...");
  const brandMap = new Map<string, string>();
  for (const b of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name },
      create: { name: b.name, slug: b.slug },
    });
    brandMap.set(b.slug, brand.id);
  }
  console.log(`  -> ${brandMap.size} brands upserted.`);

  console.log("Seeding vibes...");
  const vibeMap = new Map<string, string>();
  for (const v of vibes) {
    const vibe = await prisma.vibe.upsert({
      where: { slug: v.slug },
      update: {
        name: v.name,
        emoji: v.emoji,
        description: v.description,
        sortOrder: v.sortOrder,
      },
      create: {
        name: v.name,
        slug: v.slug,
        emoji: v.emoji,
        description: v.description,
        sortOrder: v.sortOrder,
      },
    });
    vibeMap.set(v.slug, vibe.id);
  }
  console.log(`  -> ${vibeMap.size} vibes upserted.`);

  console.log("Seeding products...");
  const productMap = new Map<string, string>();
  for (const p of products) {
    const brandId = brandMap.get(p.brandSlug);
    if (!brandId) throw new Error(`Unknown brand slug: ${p.brandSlug}`);

    const data = {
      name: p.name,
      slug: p.slug,
      brandId,
      gender: p.gender,
      fragranceFamily: p.fragranceFamily,
      shortDescription: p.shortDescription,
      description: p.description,
      topNotes: p.topNotes.join(", "),
      middleNotes: p.middleNotes.join(", "),
      baseNotes: p.baseNotes.join(", "),
      longevity: p.longevity,
      projection: p.projection,
      bestSeason: p.bestSeason.join(", "),
      bestOccasion: p.bestOccasion.join(", "),
      perfectFor: p.perfectFor,
      images: JSON.stringify(p.images),
      isBestSeller: p.isBestSeller ?? false,
      isNewArrival: p.isNewArrival ?? false,
      isSignature: p.isSignature ?? false,
      isLimitedEdition: p.isLimitedEdition ?? false,
      isGiftSet: p.isGiftSet ?? false,
    };

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: data,
      create: data,
    });
    productMap.set(p.slug, product.id);

    for (const s of p.sizes) {
      await prisma.productSize.upsert({
        where: { sku: s.sku },
        update: { size: s.size, price: s.price, stock: s.stock, productId: product.id },
        create: { size: s.size, price: s.price, stock: s.stock, sku: s.sku, productId: product.id },
      });
    }

    for (const vibeSlug of p.vibes) {
      const vibeId = vibeMap.get(vibeSlug);
      if (!vibeId) throw new Error(`Unknown vibe slug: ${vibeSlug}`);
      await prisma.productVibe.upsert({
        where: { productId_vibeId: { productId: product.id, vibeId } },
        update: {},
        create: { productId: product.id, vibeId },
      });
    }
  }
  console.log(`  -> ${productMap.size} products upserted (with sizes + vibes).`);

  console.log("Seeding bundles...");
  for (const b of bundles) {
    const bundle = await prisma.bundle.upsert({
      where: { slug: b.slug },
      update: {
        name: b.name,
        tagline: b.tagline,
        description: b.description,
        image: b.image,
        discountType: b.discountType,
        discountValue: b.discountValue,
        active: b.active,
      },
      create: {
        name: b.name,
        slug: b.slug,
        tagline: b.tagline,
        description: b.description,
        image: b.image,
        discountType: b.discountType,
        discountValue: b.discountValue,
        active: b.active,
      },
    });

    // Re-runnable: clear and re-create bundle items (no natural unique key on BundleItem).
    await prisma.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
    for (const item of b.items) {
      const productId = productMap.get(item.productSlug);
      if (!productId) throw new Error(`Unknown product slug in bundle: ${item.productSlug}`);
      await prisma.bundleItem.create({
        data: {
          bundleId: bundle.id,
          productId,
          quantity: item.quantity ?? 1,
        },
      });
    }
  }
  console.log(`  -> ${bundles.length} bundles upserted.`);

  console.log("Seeding promo codes...");
  for (const pc of promoCodes) {
    await prisma.promoCode.upsert({
      where: { code: pc.code },
      update: {
        discountType: pc.discountType,
        discountValue: pc.discountValue,
        active: pc.active,
      },
      create: {
        code: pc.code,
        discountType: pc.discountType,
        discountValue: pc.discountValue,
        active: pc.active,
      },
    });
  }
  console.log(`  -> ${promoCodes.length} promo codes upserted.`);

  console.log("Seed complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
