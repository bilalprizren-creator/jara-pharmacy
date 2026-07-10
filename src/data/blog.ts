import { Droplets, GlassWater, Pill, Scissors, Sparkles, Zap } from "lucide-react";
import type { BlogArticle } from "@/types";

/**
 * Single source of truth for the "Health & Beauty Tips" articles. Cards and the
 * article detail view are both generated from this data — content is never
 * duplicated across components. Each `relatedCategory` maps to a real product
 * category slug (see @/data/categories), so CTAs never point to a fake URL.
 */
export const blogArticles: BlogArticle[] = [
  {
    id: "b1",
    slug: "kujdesi-per-lekuren-gjate-veres",
    icon: Droplets,
    accent: "rose",
    readMinutes: 4,
    category: { al: "Lëkurë", en: "Skin care" },
    title: {
      al: "Si të kujdeseni për lëkurën gjatë verës",
      en: "How to care for your skin during summer",
    },
    excerpt: {
      al: "Hidratim, mbrojtje dhe freski — hapa të thjeshtë për një lëkurë të shëndetshme gjatë ditëve të nxehta.",
      en: "Hydration, protection and freshness — simple steps for healthy-looking skin during hot summer days.",
    },
    paragraphs: {
      al: [
        "Gjatë verës, temperaturat e larta, djersitja dhe ekspozimi në diell mund ta bëjnë lëkurën më të thatë, më të yndyrshme ose më të ndjeshme. Për këtë arsye, rutina e përditshme duhet të jetë e thjeshtë, e butë dhe e përshtatshme për tipin e lëkurës suaj.",
        "Pastrojeni fytyrën në mëngjes dhe në mbrëmje me një pastrues të butë. Pas pastrimit, përdorni një krem hidratues me teksturë të lehtë, i cili nuk e rëndon lëkurën. Gjatë ditës është e rëndësishme të përdorni mbrojtje nga dielli dhe ta riaplikoni sipas udhëzimeve të produktit, veçanërisht pas djersitjes ose qëndrimit të gjatë jashtë.",
        "Mos harroni hidratimin nga brenda. Pirja e mjaftueshme e ujit, konsumimi i frutave dhe perimeve dhe shmangia e ekspozimit të zgjatur në diell ndihmojnë në ruajtjen e freskisë së lëkurës.",
        "Çdo lëkurë ka nevoja të ndryshme. Produktet duhet të zgjidhen sipas tipit të lëkurës dhe ndjeshmërisë individuale.",
      ],
      en: [
        "During summer, high temperatures, perspiration and sun exposure can make the skin feel drier, oilier or more sensitive. A summer skin care routine should therefore remain simple, gentle and suitable for your individual skin type.",
        "Cleanse your face in the morning and evening with a mild cleanser. After cleansing, apply a lightweight moisturizer that hydrates without making the skin feel heavy. During the day, use appropriate sun protection and reapply it according to the product instructions, especially after sweating or spending a long time outdoors.",
        "Hydration also starts from within. Drinking enough water, eating fruit and vegetables and avoiding prolonged direct sun exposure can help the skin maintain a fresh and comfortable appearance.",
        "Every skin type has different needs. Choose products according to your skin type, sensitivity and daily routine. When introducing a new product, test it gradually and discontinue use if persistent irritation occurs.",
      ],
    },
    relatedCategory: "skincare",
    relatedProductLabel: {
      al: "Shiko produktet për kujdesin e lëkurës",
      en: "View skin care products",
    },
    seoTitle: {
      al: "Si të kujdeseni për lëkurën gjatë verës",
      en: "How to care for your skin during summer",
    },
    seoDescription: {
      al: "Hidratim, mbrojtje nga dielli dhe një rutinë e butë — këshilla praktike për lëkurën gjatë ditëve të nxehta.",
      en: "Hydration, sun protection and a gentle routine — practical tips for your skin during hot summer days.",
    },
  },
  {
    id: "b2",
    slug: "kur-duhet-te-perdorni-kolagjen",
    icon: GlassWater,
    accent: "rose",
    readMinutes: 5,
    category: { al: "Bukuri", en: "Beauty" },
    title: {
      al: "Kur duhet të përdorni kolagjen?",
      en: "When should you use collagen?",
    },
    excerpt: {
      al: "Çfarë është kolagjeni, kur përdoret më shpesh dhe si mund ta përfshini në rutinën tuaj të përditshme.",
      en: "What collagen is, when it is commonly used and how it may fit into your daily routine.",
    },
    paragraphs: {
      al: [
        "Kolagjeni është një proteinë që gjendet natyrshëm në trup dhe është pjesë e strukturës së lëkurës, kockave dhe indeve lidhëse. Me kalimin e moshës, prodhimi natyral i kolagjenit mund të zvogëlohet gradualisht.",
        "Suplementet me kolagjen përdoren shpesh nga persona që dëshirojnë të mbështesin kujdesin për lëkurën, flokët, thonjtë ose nyjat. Rezultatet mund të ndryshojnë nga një person te tjetri dhe zakonisht kërkohet përdorim i rregullt për një periudhë të caktuar.",
        "Kolagjeni mund të gjendet në formë pluhuri, kapsulash ose pijeje. Para përdorimit, kontrolloni përbërësit, burimin e kolagjenit dhe dozën e rekomanduar në paketim. Kjo është veçanërisht e rëndësishme nëse keni alergji, jeni shtatzënë, ushqeni me gji ose përdorni barna të tjera.",
        "Për zgjedhjen e produktit dhe mënyrën e përdorimit, konsultohuni me farmacistin ose mjekun tuaj.",
      ],
      en: [
        "Collagen is a protein naturally found in the body and forms part of the structure of the skin, bones and connective tissues. The body's natural collagen production may gradually decrease with age.",
        "Collagen supplements are often chosen by people who wish to support their general skin, hair, nail or joint care routine. Individual experiences may vary, and consistent use over a suitable period may be needed before any noticeable change is observed.",
        "Collagen products are available as powders, capsules and ready-to-drink preparations. Before use, check the ingredient list, collagen source and recommended dosage. This is particularly important if you have allergies, are pregnant or breastfeeding, or regularly take medication.",
        "A supplement should complement, rather than replace, a balanced diet. A pharmacist or doctor can help you decide whether a collagen product is suitable for your personal needs.",
      ],
    },
    relatedCategory: "collagen",
    relatedProductLabel: {
      al: "Zbulo produktet me kolagjen",
      en: "Explore collagen products",
    },
    seoTitle: {
      al: "Kur duhet të përdorni kolagjen?",
      en: "When should you use collagen?",
    },
    seoDescription: {
      al: "Çfarë është kolagjeni, format e tij dhe çfarë të kontrolloni para përdorimit — informacion i qetë dhe praktik.",
      en: "What collagen is, its forms and what to check before use — calm, practical information.",
    },
  },
  {
    id: "b3",
    slug: "vitaminat-me-te-rendesishme-per-imunitet",
    icon: Pill,
    accent: "lime",
    readMinutes: 6,
    category: { al: "Shëndet", en: "Health" },
    title: {
      al: "Vitaminat më të rëndësishme për imunitetin",
      en: "Important vitamins for normal immune function",
    },
    excerpt: {
      al: "Nga vitamina C te zinku — mbështetje e thjeshtë për funksionimin normal të sistemit imunitar.",
      en: "From vitamin C to zinc — nutrients that support the normal function of the immune system.",
    },
    paragraphs: {
      al: [
        "Funksionimi normal i sistemit imunitar mbështetet nga ushqimi i balancuar, gjumi i mjaftueshëm, aktiviteti fizik dhe marrja e lëndëve ushqyese të nevojshme.",
        "Vitamina C kontribuon në funksionimin normal të sistemit imunitar dhe gjendet në shumë fruta dhe perime. Vitamina D është gjithashtu e rëndësishme, veçanërisht gjatë periudhave kur ekspozimi në diell është më i kufizuar. Zinku është një mineral që mbështet funksionimin normal të imunitetit dhe procese të tjera në organizëm.",
        "Suplementet nuk duhet të zëvendësojnë një dietë të larmishme dhe të balancuar. Ato mund të përdoren kur marrja përmes ushqimit nuk është e mjaftueshme ose kur rekomandohen nga një profesionist shëndetësor.",
        "Kontrolloni përbërjen dhe dozën e produkteve që përdorni. Shmangni marrjen e disa suplementeve me të njëjtët përbërës pa kontrolluar dozën totale ditore.",
      ],
      en: [
        "Normal immune function is supported by a balanced diet, sufficient sleep, regular physical activity and an adequate intake of essential nutrients.",
        "Vitamin C contributes to the normal function of the immune system and is naturally present in many fruits and vegetables. Vitamin D also plays an important role, particularly during periods with limited sunlight exposure. Zinc is a mineral that supports normal immune function and several other processes in the body.",
        "Food supplements should not replace a varied and balanced diet. They may be useful when dietary intake is insufficient or when recommended by a qualified health professional.",
        "Always check the ingredients and dosage of each product. Avoid taking several supplements containing the same vitamins or minerals without considering the total daily amount. A pharmacist or doctor can help you choose an appropriate option.",
      ],
    },
    relatedCategory: "vitamins",
    relatedProductLabel: {
      al: "Shiko vitaminat dhe mineralet",
      en: "View vitamins and minerals",
    },
    seoTitle: {
      al: "Vitaminat më të rëndësishme për imunitetin",
      en: "Important vitamins for normal immune function",
    },
    seoDescription: {
      al: "Vitamina C, vitamina D dhe zinku — si mbështesin funksionimin normal të imunitetit si pjesë e një jetese të balancuar.",
      en: "Vitamin C, vitamin D and zinc — how they support normal immune function as part of a balanced lifestyle.",
    },
  },
  {
    id: "b4",
    slug: "kujdesi-per-floke-te-forta",
    icon: Scissors,
    accent: "green",
    readMinutes: 4,
    category: { al: "Flokë", en: "Hair care" },
    title: {
      al: "Kujdesi për flokë të fortë dhe të shëndetshëm",
      en: "Caring for strong and healthy-looking hair",
    },
    excerpt: {
      al: "Një rutinë e butë, ushqimi i balancuar dhe kujdesi i vazhdueshëm për flokët dhe skalpin.",
      en: "A gentle routine, balanced nutrition and consistent care for your hair and scalp.",
    },
    paragraphs: {
      al: [
        "Flokët e shëndetshëm kërkojnë kujdes të rregullt si nga jashtë, ashtu edhe nga brenda. Larja shumë e shpeshtë, temperaturat e larta dhe produktet agresive mund t'i bëjnë flokët më të thatë dhe më të brishtë.",
        "Zgjidhni shampon sipas tipit të flokëve dhe gjendjes së skalpit. Aplikoni balsamin kryesisht në gjatësinë dhe majat e flokëve. Kufizoni përdorimin e tharëses, drejtueses ose pajisjeve të tjera me temperaturë të lartë dhe përdorni mbrojtje termike kur është e nevojshme.",
        "Një dietë e balancuar që përmban proteina, hekur, zink dhe vitamina ndihmon në ruajtjen e gjendjes normale të flokëve. Produktet kozmetike dhe suplementet duhet të zgjidhen sipas nevojave individuale.",
        "Në rast të rënies së papritur, të theksuar ose të vazhdueshme të flokëve, këshillohet konsultimi me mjekun për të identifikuar shkakun.",
      ],
      en: [
        "Healthy-looking hair benefits from regular care both externally and through a balanced lifestyle. Very frequent washing, excessive heat and harsh products can leave the hair feeling dry, fragile or difficult to manage.",
        "Choose a shampoo according to your hair type and scalp condition. Apply conditioner mainly to the lengths and ends. Limit the use of hair dryers, straighteners and other high-temperature styling tools, and use heat protection when needed.",
        "A balanced diet containing protein, iron, zinc and essential vitamins supports the maintenance of normal hair. Cosmetic products and supplements should be selected according to individual needs rather than general trends.",
        "If hair loss is sudden, significant or persistent, professional medical advice is recommended to help identify the possible cause. Hair care results usually require patience and consistent use.",
      ],
    },
    relatedCategory: "haircare",
    relatedProductLabel: {
      al: "Shiko produktet për flokë",
      en: "View hair care products",
    },
    seoTitle: {
      al: "Kujdesi për flokë të fortë dhe të shëndetshëm",
      en: "Caring for strong and healthy-looking hair",
    },
    seoDescription: {
      al: "Një rutinë e butë, mbrojtje nga nxehtësia dhe ushqim i balancuar për të ruajtur gjendjen normale të flokëve.",
      en: "A gentle routine, heat protection and balanced nutrition to help maintain normal, healthy-looking hair.",
    },
  },
  {
    id: "b5",
    slug: "si-te-zgjidhni-produktin-e-duhur-per-fytyren",
    icon: Sparkles,
    accent: "teal",
    readMinutes: 5,
    category: { al: "Lëkurë", en: "Skin care" },
    title: {
      al: "Si të zgjidhni produktin e duhur për fytyrën?",
      en: "How to choose the right product for your face",
    },
    excerpt: {
      al: "Njihni tipin e lëkurës dhe zgjidhni serum, krem ose produkt tjetër sipas nevojave reale.",
      en: "Understand your skin type and choose a serum, cream or treatment according to its actual needs.",
    },
    paragraphs: {
      al: [
        "Para se të blini një produkt për fytyrën, është e rëndësishme të njihni tipin e lëkurës suaj. Lëkura mund të jetë e thatë, e yndyrshme, e kombinuar, normale ose e ndjeshme.",
        "Për lëkurë të thatë përdoren zakonisht produkte hidratuese dhe formula të buta. Lëkura e yndyrshme mund të përfitojë nga tekstura të lehta dhe produkte jokomedogjene. Për lëkurë të ndjeshme është mirë të zgjidhen formula pa aroma të forta dhe me sa më pak përbërës potencialisht irritues.",
        "Kur filloni një produkt të ri, testojeni fillimisht në një zonë të vogël. Mos shtoni disa përbërës aktivë njëkohësisht, sepse kjo mund ta bëjë më të vështirë identifikimin e shkakut të irritimit.",
        "Një rutinë bazë mund të përmbajë pastrues të butë, hidratues dhe mbrojtje nga dielli. Produktet e tjera mund të shtohen gradualisht sipas nevojave konkrete të lëkurës.",
      ],
      en: [
        "Before purchasing a face product, it is important to understand your skin type. Skin may be dry, oily, combination, normal or sensitive, and each type can respond differently to cosmetic ingredients.",
        "Dry skin often benefits from moisturizing products and gentle formulas. Oily skin may prefer lightweight, non-comedogenic textures. For sensitive skin, consider fragrance-free formulas with fewer potentially irritating ingredients.",
        "When introducing a new product, test it on a small area first. Avoid adding several active ingredients at the same time, as this can make it difficult to identify which product is causing irritation.",
        "A simple basic routine may include a gentle cleanser, moisturizer and suitable sun protection. Serums, exfoliating products and other treatments can be introduced gradually according to your skin's actual needs.",
      ],
    },
    relatedCategory: "skincare",
    relatedProductLabel: {
      al: "Gjej produktin për lëkurën tënde",
      en: "Find the right product for your skin",
    },
    seoTitle: {
      al: "Si të zgjidhni produktin e duhur për fytyrën?",
      en: "How to choose the right product for your face",
    },
    seoDescription: {
      al: "Njihni tipin e lëkurës dhe ndërtoni një rutinë bazë të thjeshtë me pastrues, hidratues dhe mbrojtje nga dielli.",
      en: "Understand your skin type and build a simple basic routine with a cleanser, moisturizer and sun protection.",
    },
  },
  {
    id: "b6",
    slug: "magnezi-dhe-roli-i-tij-per-energjine",
    icon: Zap,
    accent: "green",
    readMinutes: 4,
    category: { al: "Shëndet", en: "Health" },
    title: {
      al: "Magnezi dhe roli i tij për energjinë",
      en: "Magnesium and its role in energy metabolism",
    },
    excerpt: {
      al: "Pse magnezi është i rëndësishëm për energjinë, muskujt dhe sistemin nervor.",
      en: "Why magnesium is important for energy metabolism, muscles and the nervous system.",
    },
    paragraphs: {
      al: [
        "Magnezi është një mineral që kontribuon në funksionimin normal të muskujve, sistemit nervor dhe metabolizmit të energjisë. Ai gjendet natyrshëm në arra, fara, drithëra integrale, perime me gjethe të gjelbra dhe ushqime të tjera.",
        "Suplementet me magnez përdoren zakonisht kur marrja përmes ushqimit nuk është e mjaftueshme ose kur një profesionist shëndetësor rekomandon plotësimin e tij. Ekzistojnë forma të ndryshme të magnezit, të cilat mund të ndryshojnë në përbërje dhe tolerancë nga një person te tjetri.",
        "Respektoni dozën e rekomanduar në paketim. Marrja e tepërt e disa formave të magnezit mund të shkaktojë shqetësime në tretje.",
        "Personat që përdorin barna, kanë probleme me veshkat, janë shtatzënë ose ushqejnë me gji duhet të konsultohen me mjekun ose farmacistin para përdorimit. Magnezi duhet të jetë pjesë e një rutine që përfshin ushqim të balancuar, pushim dhe aktivitet fizik.",
      ],
      en: [
        "Magnesium is a mineral that contributes to normal muscle function, normal nervous system function and normal energy-yielding metabolism. It is naturally present in nuts, seeds, whole grains, green leafy vegetables and many other foods.",
        "Magnesium supplements are commonly considered when dietary intake is insufficient or when supplementation is recommended by a health professional. Different forms of magnesium are available, and individual tolerance may vary.",
        "Always follow the dosage stated on the product packaging. Excessive intake of certain forms of magnesium may cause digestive discomfort.",
        "People who regularly take medication, have kidney problems, are pregnant or are breastfeeding should consult a doctor or pharmacist before use. Magnesium should be viewed as one part of a balanced routine that also includes appropriate nutrition, rest and physical activity.",
      ],
    },
    relatedCategory: "health-care",
    relatedProductLabel: {
      al: "Shiko produktet me magnez",
      en: "View magnesium products",
    },
    seoTitle: {
      al: "Magnezi dhe roli i tij për energjinë",
      en: "Magnesium and its role in energy metabolism",
    },
    seoDescription: {
      al: "Si kontribuon magnezi në funksionimin normal të muskujve, nervave dhe metabolizmit të energjisë — dhe si të përdoret me kujdes.",
      en: "How magnesium contributes to normal muscle, nerve and energy metabolism — and how to use it responsibly.",
    },
  },
];
