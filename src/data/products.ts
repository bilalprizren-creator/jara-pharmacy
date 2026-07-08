import type { Product } from "@/types";

/**
 * Starter catalog derived from the brand's social references.
 * This is an inquiry-first experience — there is no checkout in v1.
 * Shape is CMS-ready: add fields or a `price` later without refactoring.
 */
export const products: Product[] = [
  {
    id: "lavender-face-spray",
    slug: "naturagen-lavender-face-spray",
    name: "Naturagen Lavender Face Spray",
    brand: "Naturagen",
    category: "skincare",
    categoryLabel: { al: "Kujdes për lëkurën", en: "Skincare" },
    badge: { al: "I ri", en: "New" },
    shortDescription: {
      al: "Hidraton, qetëson dhe rifreskon lëkurën.",
      en: "Hydrates, soothes and refreshes the skin.",
    },
    benefits: {
      al: [
        "Freski e menjëhershme për çdo tip lëkure",
        "Me ujë distiluar lavande dhe kolagjen të hidrolizuar",
        "I përshtatshëm për përdorim gjatë ditës",
      ],
      en: [
        "Instant freshness for every skin type",
        "With distilled lavender water and hydrolyzed collagen",
        "Suitable for use throughout the day",
      ],
    },
    usage: {
      al: "Spërkat në distancë 20 cm nga fytyra, sipas nevojës gjatë ditës.",
      en: "Spray 20 cm from the face, as needed throughout the day.",
    },
    visual: { form: "spray", palette: "rose", label: "FACE SPRAY" },
    featured: true,
    tags: ["hidratim", "freski", "lavande"],
  },
  {
    id: "repair-bubble-serum",
    slug: "naturagen-repair-bubble-serum",
    name: "Naturagen Repair Bubble Serum",
    brand: "Naturagen",
    category: "skincare",
    categoryLabel: { al: "Kujdes për lëkurën", en: "Skincare" },
    badge: { al: "Popullor", en: "Popular" },
    shortDescription: {
      al: "Ndihmon barrierën mbrojtëse dhe jep shkëlqim natyral.",
      en: "Supports the skin barrier and natural glow.",
    },
    benefits: {
      al: [
        "Me Ceramide, Vitaminë B5, B12 dhe E",
        "Forcon barrierën mbrojtëse të lëkurës",
        "Lëkurë më e shëndetshme dhe më e ndritshme",
      ],
      en: [
        "With Ceramide, Vitamin B5, B12 and E",
        "Strengthens the skin's protective barrier",
        "Healthier, brighter-looking skin",
      ],
    },
    usage: {
      al: "Apliko në lëkurë të pastër mëngjes dhe mbrëmje para hidratuesit.",
      en: "Apply to clean skin morning and evening before moisturizer.",
    },
    visual: { form: "dropper", palette: "rose", label: "BUBBLE SERUM" },
    featured: true,
    tags: ["serum", "ceramide", "shkëlqim"],
  },
  {
    id: "rosemary-shampoo",
    slug: "naturagen-rosemary-shampoo",
    name: "Naturagen Rosemary Shampoo",
    brand: "Naturagen",
    category: "haircare",
    categoryLabel: { al: "Kujdes për flokë", en: "Hair Care" },
    badge: { al: "Për flokë", en: "For hair" },
    shortDescription: {
      al: "Pastron butësisht dhe ndihmon freskinë e skalpit.",
      en: "Cleanses gently and supports scalp freshness.",
    },
    benefits: {
      al: [
        "Me vaj rozmarine dhe peptide kolagjeni",
        "Për të gjitha llojet e flokëve",
        "Ndihmon rrënjë të forta dhe shkëlqim natyral",
      ],
      en: [
        "With rosemary oil and collagen peptides",
        "For all hair types",
        "Supports strong roots and natural shine",
      ],
    },
    usage: {
      al: "Masazho në flokë të lagur, lëre 1–2 minuta dhe shpëlaj.",
      en: "Massage into wet hair, leave for 1–2 minutes and rinse.",
    },
    visual: { form: "bottle", palette: "green", label: "ROSEMARY" },
    featured: true,
    tags: ["rozmarinë", "skalp", "flokë"],
  },
  {
    id: "rosemary-conditioner",
    slug: "naturagen-rosemary-conditioner",
    name: "Naturagen Rosemary Conditioner",
    brand: "Naturagen",
    category: "haircare",
    categoryLabel: { al: "Kujdes për flokë", en: "Hair Care" },
    badge: { al: "Për flokë", en: "For hair" },
    shortDescription: {
      al: "Ushqen gjatësinë dhe ndihmon butësinë e flokëve.",
      en: "Nourishes hair lengths and improves softness.",
    },
    benefits: {
      al: [
        "Kujdes intensiv me rozmarinë dhe biotin",
        "Butësi dhe efekt kundër ndërthurjes",
        "Ideal për flokë të thata dhe të dëmtuara",
      ],
      en: [
        "Intensive care with rosemary and biotin",
        "Softness and anti-frizz effect",
        "Ideal for dry and damaged hair",
      ],
    },
    usage: {
      al: "Apliko pas shampos në gjatësi, lëre 2–3 minuta dhe shpëlaj.",
      en: "Apply after shampoo along the lengths, leave 2–3 minutes and rinse.",
    },
    visual: { form: "tube", palette: "green", label: "CONDITIONER" },
    featured: false,
    tags: ["rozmarinë", "butësi", "flokë"],
  },
  {
    id: "collagen-peptides-powder",
    slug: "collagen-peptides-powder",
    name: "Collagen Peptides Powder",
    brand: "Naturagen",
    category: "collagen",
    categoryLabel: { al: "Kolagjen & bukuri", en: "Collagen & Beauty" },
    badge: { al: "Beauty", en: "Beauty" },
    shortDescription: {
      al: "Mbështet rutinën e bukurisë dhe kujdesin e përditshëm.",
      en: "Supports beauty routines and daily care.",
    },
    benefits: {
      al: [
        "Peptide kolagjeni për lëkurë, flokë dhe thonj",
        "Shije e freskët green apple",
        "E lehtë për ta shtuar në ujë ose smoothie",
      ],
      en: [
        "Collagen peptides for skin, hair and nails",
        "Fresh green apple flavor",
        "Easy to add to water or a smoothie",
      ],
    },
    usage: {
      al: "Shto një lugë në ujë ose lëng një herë në ditë.",
      en: "Add one scoop to water or juice once a day.",
    },
    visual: { form: "jar", palette: "violet", label: "COLLAGEN" },
    featured: true,
    tags: ["kolagjen", "bukuri", "peptide"],
  },
  {
    id: "beauty-assist-sachets",
    slug: "beauty-assist-collagen-sachets",
    name: "Beauty Assist Collagen Sachets",
    brand: "Naturagen Pro",
    category: "collagen",
    categoryLabel: { al: "Kolagjen & bukuri", en: "Collagen & Beauty" },
    badge: { al: "Bestseller", en: "Bestseller" },
    shortDescription: {
      al: "Format praktik për përdorim të përditshëm.",
      en: "Practical daily-use format.",
    },
    benefits: {
      al: [
        "Një qese në ditë — lehtë për ta marrë kudo",
        "30 ditë rutinë bukurie",
        "Mbështet lëkurën nga brenda",
      ],
      en: [
        "One sachet a day — easy to take anywhere",
        "A 30-day beauty routine",
        "Supports skin from within",
      ],
    },
    usage: {
      al: "Trete një qese në ujë një herë në ditë, mundësisht në mëngjes.",
      en: "Dissolve one sachet in water once a day, ideally in the morning.",
    },
    visual: { form: "sachet", palette: "rose", label: "BEAUTY ASSIST" },
    featured: false,
    tags: ["kolagjen", "sachet", "rutinë"],
  },
  {
    id: "swiss-energy-kids",
    slug: "swiss-energy-kids-gummies",
    name: "Swiss Energy Kids Gummies",
    brand: "Swiss Energy",
    category: "mother-baby",
    categoryLabel: { al: "Nënë & bebe", en: "Mother & Baby" },
    badge: { al: "Për familje", en: "Family" },
    shortDescription: {
      al: "Mbështetje e lehtë për rutinën e fëmijëve.",
      en: "Easy support for children's routines.",
    },
    benefits: {
      al: [
        "Multivitamina në formë argëtuese për fëmijë (3+)",
        "Pa gluten, pa laktozë, pa konservues artificialë",
        "Shije e shijshme frutash",
      ],
      en: [
        "Multivitamin gummies for kids (3+)",
        "Gluten-free, lactose-free, no artificial preservatives",
        "Tasty fruit flavor",
      ],
    },
    usage: {
      al: "Sipas udhëzimeve në paketim ose këshillës së farmacistit.",
      en: "As directed on the pack or per pharmacist advice.",
    },
    visual: { form: "gummies", palette: "amber", label: "SWISS ENERGY" },
    featured: true,
    tags: ["fëmijë", "vitamina", "gummies"],
  },
  {
    id: "nucal-z",
    slug: "nucal-z-calcium-magnesium-zinc-d3",
    name: "Nucal-Z Calcium Magnesium Zinc D3",
    brand: "Nutrifactor",
    category: "vitamins",
    categoryLabel: { al: "Vitamina & suplemente", en: "Vitamins & Supplements" },
    badge: { al: "Minerale", en: "Minerals" },
    shortDescription: {
      al: "Mbështet kockat dhe mirëqenien e përgjithshme.",
      en: "Supports bones and general wellbeing.",
    },
    benefits: {
      al: [
        "Kalcium, Magnez, Zink dhe Vitaminë D3",
        "Mbështet kockat dhe dhëmbët",
        "Kontribon në imunitet dhe energji",
      ],
      en: [
        "Calcium, Magnesium, Zinc and Vitamin D3",
        "Supports bones and teeth",
        "Contributes to immunity and energy",
      ],
    },
    usage: {
      al: "Merr sipas dozës së rekomanduar në paketim, me ushqim.",
      en: "Take per the recommended dose on the pack, with food.",
    },
    visual: { form: "bottle", palette: "teal", label: "NUCAL-Z" },
    featured: false,
    tags: ["minerale", "kocka", "imunitet"],
  },
  {
    id: "magnesium-supplement",
    slug: "magnesium-supplement",
    name: "Magnesium Supplement",
    brand: "Dr. Frei",
    category: "health-care",
    categoryLabel: { al: "Kujdes shëndetësor", en: "Health Care" },
    badge: { al: "Energji", en: "Energy" },
    shortDescription: {
      al: "Mbështet energjinë dhe funksionin e muskujve.",
      en: "Supports energy and muscle function.",
    },
    benefits: {
      al: [
        "Mbështetje e përditshme për energji dhe nerva",
        "Ndihmon funksionin normal të muskujve",
        "Format praktik për çdo ditë",
      ],
      en: [
        "Daily support for energy and nerves",
        "Helps normal muscle function",
        "Practical format for every day",
      ],
    },
    usage: {
      al: "Një dozë në ditë, mundësisht në mbrëmje.",
      en: "One dose a day, preferably in the evening.",
    },
    visual: { form: "box", palette: "amber", label: "MAGNESIUM" },
    featured: false,
    tags: ["magnez", "energji", "muskuj"],
  },
  {
    id: "foot-guard-spray",
    slug: "foot-guard-spray",
    name: "Foot Guard Spray",
    brand: "Naturagen",
    category: "foot-care",
    categoryLabel: { al: "Kujdes për këmbët", en: "Foot Care" },
    badge: { al: "Freski", en: "Fresh" },
    shortDescription: {
      al: "Freski e menjëhershme për këmbët.",
      en: "Instant freshness for feet.",
    },
    benefits: {
      al: [
        "Veprim i menjëhershëm dhe i butë çdo ditë",
        "Pa aromë të fortë, pa djersë, pa shqetësim",
        "Ideal pas stërvitjes ose një dite të gjatë",
      ],
      en: [
        "Immediate, gentle action every day",
        "No strong scent, no sweat, no discomfort",
        "Ideal after training or a long day",
      ],
    },
    usage: {
      al: "Spërkat në këmbë të pastra dhe të thata sipas nevojës.",
      en: "Spray on clean, dry feet as needed.",
    },
    visual: { form: "spray", palette: "orange", label: "FOOT GUARD" },
    featured: true,
    tags: ["këmbë", "freski", "spray"],
  },
  {
    id: "collagatin-sachets",
    slug: "collagatin-sachets",
    name: "Collagatin Sachets",
    brand: "Nutrifactor",
    category: "collagen",
    categoryLabel: { al: "Kolagjen & bukuri", en: "Collagen & Beauty" },
    badge: { al: "Kolagjen", en: "Collagen" },
    shortDescription: {
      al: "Ndihmon rutinën e bukurisë nga brenda.",
      en: "Supports beauty from within.",
    },
    benefits: {
      al: [
        "Kolagjen i hidrolizuar Type 1 & 3",
        "Për lëkurë, flokë dhe thonj",
        "Format i thjeshtë sachet për çdo ditë",
      ],
      en: [
        "Hydrolyzed collagen Type 1 & 3",
        "For skin, hair and nails",
        "Simple daily sachet format",
      ],
    },
    usage: {
      al: "Trete një qese në ujë një herë në ditë.",
      en: "Dissolve one sachet in water once a day.",
    },
    visual: { form: "box", palette: "rose", label: "COLLAGATIN" },
    featured: false,
    tags: ["kolagjen", "sachet", "bukuri"],
  },
  {
    id: "face-cream",
    slug: "naturagen-face-cream",
    name: "Naturagen Face Cream",
    brand: "Naturagen",
    category: "skincare",
    categoryLabel: { al: "Kujdes për lëkurën", en: "Skincare" },
    badge: { al: "Kujdes ditor", en: "Daily care" },
    shortDescription: {
      al: "Hidratim dhe rehati për përdorim të përditshëm.",
      en: "Hydration and comfort for everyday use.",
    },
    benefits: {
      al: [
        "Hidratim i thellë dhe i qëndrueshëm",
        "Teksturë e lehtë, thith shpejt",
        "Për të gjitha llojet e lëkurës",
      ],
      en: [
        "Deep, long-lasting hydration",
        "Light texture, absorbs quickly",
        "For all skin types",
      ],
    },
    usage: {
      al: "Apliko në fytyrë të pastër mëngjes dhe mbrëmje.",
      en: "Apply to clean face morning and evening.",
    },
    visual: { form: "jar", palette: "cream", label: "FACE CREAM" },
    featured: true,
    tags: ["hidratim", "krem", "ditor"],
  },
];
