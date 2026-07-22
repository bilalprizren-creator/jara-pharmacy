import type { CategorySlug } from "@/types";

/**
 * Hand-maintained curation applied on top of the machine-generated SHEMO import
 * store (`src/data/imported/shemo-products.json`). Kept separate from that file
 * so it survives re-running `scripts/import-shemo.mjs`, which always regenerates
 * every scraped record (resets `featured`, and derives `category` purely from the
 * source section heading).
 */

/** Imported products to feature on the homepage despite no curated counterpart. */
export const featuredOverrideCodes = new Set<string>([
  "4170", // Ivy Bear Boost Energy 60 Gummies — replaces "Swiss Energy Kids Gummies"
  "0157", // Nutrifactor Magnesium 500mg 60 tablets — replaces "Magnesium Supplement"
]);

/* ------------------------------------------------------------------ */
/*  Category corrections                                               */
/* ------------------------------------------------------------------ */
/**
 * The importer maps a whole SHEMO section heading to ONE category. Several
 * sections are mixed, so products land in the wrong place. We correct this at
 * load time (in `products.ts`) without re-running the importer:
 *
 *   effective category = codeOverride ?? sectionRemap[sourceCategory] ?? category
 *
 * `categorySectionRemap` fixes a whole section's default; `categoryCodeOverrides`
 * fixes the individual exceptions within a section (keyed by productCode).
 */

/** Whole-section default corrections, keyed by the SHEMO section heading. */
export const categorySectionRemap: Record<string, CategorySlug> = {
  // Froika is a dermocosmetics brand (skin/hair/oral), not a baby brand.
  Froika: "skincare",
  // Grab-bag of baking soda, nasal sprays, oils, rubs — not supplements.
  "Multiplus suplement": "health-care",
};

/** Per-product category overrides (exceptions within a section), keyed by productCode. */
export const categoryCodeOverrides: Record<string, CategorySlug> = {
  // → beauty (perfumes, mascara, deodorants, waxing, tweezers, brow/lash serum)
  "3009": "beauty", // Veet normal 100ml
  "3010": "beauty", // Veet sensitive 100ml
  "3091": "beauty", // Veet Expert Waxing Strips Sensitive Skin A12
  "3092": "beauty", // Veet Expert Waxing Strips Dry Skin A12
  "4117": "beauty", // Story of love - parfum & krem
  "4120": "beauty", // Essence mascara volume 12ml
  "4660": "beauty", // Parfum frozen 30ml
  "4673": "beauty", // Veet silky fresh 100ml
  "7112": "beauty", // Gur & roller masazhues per fytyre
  "7123": "beauty", // Parfum Pink Stone 30ml
  "7126": "beauty", // Parfum Fullmoon 02 30ml
  "7127": "beauty", // Parfum fusion Flowers 50ml
  "7438": "beauty", // Pincete profesionale
  "7447": "beauty", // Aceton Classico 125ml
  "7471": "beauty", // Serum per vetulla dhe qerpik 20ml
  "7674": "beauty", // Rexona Maximum Cream Clean Scent
  "7675": "beauty", // Rexona Maximum Cream Stress Control
  "7680": "beauty", // Rexona Maximum Cream Sport Strength
  "7683": "beauty", // Whisper 50ML Antiperspirant-Deodorant-Cream 24H
  "7775": "beauty", // Anti-Perspirant Spray 60ml

  // → collagen (ingestible collagen supplements)
  "4081": "collagen", // Collagen beauty 1.000mg 60 tablets
  "4083": "collagen", // Collagen peptides 8.000mg collagen 30 sachets
  "4085": "collagen", // Imun collagen sambucus 650mg collagen 30 tablets
  "4086": "collagen", // Imun collagen curcumin 650mg collagen 30 tablets
  "4087": "collagen", // Collagen liquid 2.500mg 60ml
  "4090": "collagen", // Collagen gurme 5.000mg 150g
  "4093": "collagen", // Multi collagen powder 10.000mg collagen 330g
  "4095": "collagen", // Collagen peptides beauty assist 8.00mg 30 sachets
  "4098": "collagen", // Beauty gummy collagen 60 gummies
  "4127": "collagen", // Collagen Peptides Powder Green Apple 300G
  "7227": "collagen", // Collagen 10X25ml shotic (Axion)
  "7367": "collagen", // Collagen Beauty 20eff
  "7494": "collagen", // Beauty collagen 25ml
  "9605": "collagen", // Alpha peptide collagen 11.000mg 25ml
  "9606": "collagen", // Alpha peptide collagen 25ml
  "0477": "collagen", // Nature Collagen Powder 240g
  "0179": "collagen", // Nutri collagen (lekure, floke, thonje te shendetshem) 60 capsules
  "0191": "collagen", // Gencell (collagen peptides+ biotin&vitamin C) 60 tablets

  // → foot-care (foot creams/sprays/powders, blister balm, toe protector)
  "2011": "foot-care", // Krem per kembe me herbale alpine 250ml
  "2096": "foot-care", // Balsam ne form Sticku per flluska ne kembe 15ml
  "2098": "foot-care", // Mbrojtese ne form tubi per gishta te kembes A1
  "2300": "foot-care", // Sprej per kembe foot guard 180ml
  "2304": "foot-care", // Gur per thembra te kembeve
  "2310": "foot-care", // Puder per kembe 50g
  "2330": "foot-care", // Krem per kembe foot guard 50ml
  "2900": "foot-care", // Krem per kembe 100ml
  "5246": "foot-care", // Puder per kembe 10g

  // → haircare (shampoos, minoxidil, scalp care, hair colour restorers, hair brush)
  "2107": "haircare", // Restoria discreet 147ml
  "4107": "haircare", // Reapir + rosemary hair conditioner 200ml
  "4134": "haircare", // Rosemary Water Hair Spray 100ML
  "4135": "haircare", // Rosemary Shampoo 400ML
  "4136": "haircare", // Rosemary Hair Serum 30ML
  "4970": "haircare", // Minoxidil 2% Hair Spray 100ml
  "4973": "haircare", // Minoxidil 5% spray 100ml
  "4976": "haircare", // Minoxidil 10% Hair Spray 100ml
  "5190": "haircare", // Syoss Shampoo Rizos Pro 440ml
  "5217": "haircare", // Diskret colour restoring cream 150ml
  "5232": "haircare", // Bioscalin energy shampoo 200ml
  "6232": "haircare", // Bioscalin total care shampoo 200ml
  "6233": "haircare", // Bioscalin menopausa shmpoo rinforzante 200ml
  "6234": "haircare", // Bioscalin anti forfora shampoo lenitivo 200ml
  "6235": "haircare", // Bioscalin anti forfora shampoo purificante 200ml
  "7120": "haircare", // Brush per floke (Unicorn)
  "7755": "haircare", // Pyrocton shampoo 200ml
  "7756": "haircare", // Renex plus tar/sulfur shampoo 200ml
  "7757": "haircare", // Renex - S foaming cleasing liquid 200ml
  "7759": "haircare", // Ninolin shampoo 125ml
  "7761": "haircare", // Climbazole shampoo 200ml
  "7762": "haircare", // Pantogrin plus shampoo 200ml
  "7763": "haircare", // Anti hair loss peptide shampoo 200ml
  "7783": "haircare", // Anti-Oilness Shampoo 200ML
  "7787": "haircare", // Pantogrin Plus Lotion 100 ML
  "7789": "haircare", // Anti - hair loss peptide lotion 100ml
  "7791": "haircare", // Anti - dry dandruf shampoo 200ml
  "7792": "haircare", // Anti-oily dandruf ds shampoo 200ml
  "9491": "haircare", // PS Shampoo for Scalp 200ml

  // → health-care (medicated topicals, anti-lice/antifungal shampoos, first aid)
  "1088": "health-care", // Hygia Shampoo 1%
  "1547": "health-care", // Balsam tigri kinez 19.4g
  "1625": "health-care", // Herpesan gel 7g
  "1662": "health-care", // Mycoseb 2% shampon 100ml
  "1710": "health-care", // Puder e lenget 120ml
  "1715": "health-care", // Anti-scabiens 100ml
  "1726": "health-care", // Sulfur ointment 10% 100g
  "1727": "health-care", // Sulfur ointment 15% 100g
  "1728": "health-care", // Sulfur ointment 20% 100g
  "2813": "health-care", // Bitsiz - shampo per parazit 100ml
  "2849": "health-care", // Multibit 200ml (Shampo per parazit)
  "2852": "health-care", // Multibit 100ml (sprej kunder morrave)
  "3052": "health-care", // Leng per lythi me brushe 12ml
  "3054": "health-care", // Pika per lythi collodion acid 10ml
  "4968": "health-care", // Alcohol Swab 100pcs
  "8919": "health-care", // Pantenol mast 50g

  // → intimate-care
  "4068": "intimate-care", // SVX vaginal douche sodium bicarbonate 150ml
  "4069": "intimate-care", // SVX intimate cleaning liquid 250ml
  "5185": "intimate-care", // Nivea Intimo Fresh 250ml
  "5186": "intimate-care", // Nivea Intimo Natural 250ml
  "7671": "intimate-care", // Carefree Intim Wash 200ml
  "7776": "intimate-care", // Zetasin lubricating jelly 90ml
  "9868": "intimate-care", // Genestin Intimate Cream 30ml

  // → medical-devices
  "7781,7777": "medical-devices", // Doreza guanto corto algodon S,M & nitrilo S,M,L

  // → mother-baby (baby creams misfiled under general cosmetics)
  "1451": "mother-baby", // Bebe day & night 50ml
  "1455": "mother-baby", // Bebe zart creme 50ml
  "1462": "mother-baby", // Bebe zart creme 150ml
  "1521": "mother-baby", // Baby cream 60ml
  "1522": "mother-baby", // Baby cream 300ml

  // → natural (oils, herbal syrups, teas)
  "2815": "natural", // Vaj bademi 30ml
  "2826": "natural", // Vaj ricini (fruta mix) 50ml
  "2829": "natural", // Vaj ricini (mint) 50ml
  "2843": "natural", // Black mulberry syrup (shurup dudi) 80g
  "2844": "natural", // Black mulberry (shurup dudi) 40g
  "4031": "natural", // Vaj esencial rosmarine 10ml
  "4064": "natural", // Vaj ricini (molle) 50ml
  "4128": "natural", // Immune Booster Tea A20 (Qaj për Imunitet)
  "4129": "natural", // Detox Booster Tea A20 (Qaj për Detox)
  "4130": "natural", // Late Night Tea A20 (Qaj për Qetësim)

  // → oral-care (Froika mouth rinses, misfiled under the Froika section)
  "7730": "oral-care", // Froiplak homeo apple - cinnamon 250ml
  "7731": "oral-care", // Froiplak homeo orange 250ml
  "7766": "oral-care", // Froiplak gel 40ml
  "7767": "oral-care", // Froiplak plus 250ml
  "7806": "oral-care", // Froiplak fluor fluoride mouthrinse 250ml
  "7813": "oral-care", // Froiplak 0.12 oral rinse 250ml
  "7815": "oral-care", // Froiplak plus 0.20 250ml
  "7818": "oral-care", // Froisept mouth wash 250ml
  "7855": "oral-care", // Froiplak homeo fluoride mouthrinse spearmint 250ml

  // → other (character/toy gift sets — not oral care)
  "3031": "other", // Disney Micky Mouse Set Qante 3+
  "3035": "other", // Disney Minnie Mouse Set me Qante 3+
  "3038": "other", // Winx Set me Qante 3+
  "3045": "other", // Minions Set me Qant 3+
  "3056": "other", // Spiderman Kit me Qante 3+
  "3061": "other", // Disney Princess Set me Qante 3+
  "3069": "other", // Barbie Set me Qante 3+
  "3101": "other", // Stitch Set me Qante Soft 3+
  "3103": "other", // Stumble Guys Set me Qante 3+
  "3104": "other", // Hot wheels set me Qante 3+
  "5239": "other", // Marvel spider-man set me qant 3+
  "5240": "other", // Disney princess set me qant
  "5241": "other", // Hot wheels gift set me qant 3+
  "5242": "other", // Disney stitch gift set

  // → skincare (face products misfiled under Aqua/Cellcense sections)
  "0230": "skincare", // Extra-C Brightening Serum 30ml (+Collagen and Centella)
  "0232": "skincare", // Hyaluronic Acid & Collagen 30ml
  "4172": "skincare", // Restorative acne face serum 15ml
  "4173": "skincare", // Restorative acne face cream 30ml
  "4174": "skincare", // Purifying salicylic face cleanser 50ml
  "4175": "skincare", // Lavander face spray 100ml
  "4176": "skincare", // Rice face spray 100ml
  "4178": "skincare", // Bright bubble serum 100ml
  "4179": "skincare", // Repair bubble serum 100ml

  // → vitamins (supplements misfiled under Multiplus/Aqua sections)
  "2832": "vitamins", // Vitamin C 1000mg 60 tablets
  "2846": "vitamins", // Fawar lemon A6 (forcim te sistemi imunitar)
  "4097": "vitamins", // Omega 3 fish oil 60 capsules
  "4105": "vitamins", // Magne 5D 200mg - 30tab
  "4131": "vitamins", // Vitamin D3 +K2 1000IU 60 Softgels
  "4132": "vitamins", // Red +Booster Immune A20
  "4133": "vitamins", // Bromelain 1000MG 60 Capsule
};
