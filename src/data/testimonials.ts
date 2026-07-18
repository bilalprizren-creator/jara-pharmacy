import type { Testimonial } from "@/types";

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    rating: 5,
    quote: {
      al: "Shërbim shumë profesional dhe staf shumë i sjellshëm.",
      en: "Very professional service and very kind staff.",
    },
    name: "Arta K.",
    role: { al: "Klientë në Prizren", en: "Customer in Prizren" },
  },
  {
    id: "t2",
    rating: 5,
    quote: {
      al: "Produkte cilësore dhe këshillim i saktë.",
      en: "Quality products and accurate guidance.",
    },
    name: "Bledi M.",
    role: { al: "Klientë besnik", en: "Loyal customer" },
  },
  {
    id: "t3",
    rating: 5,
    quote: {
      al: "Farmaci moderne, e pastër dhe shumë e organizuar.",
      en: "A modern, clean and very well-organized pharmacy.",
    },
    name: "Elena R.",
    role: { al: "Klientë", en: "Customer" },
  },
  {
    id: "t4",
    rating: 5,
    quote: {
      al: "Gjithmonë gjej produktet që më duhen për familjen.",
      en: "I always find the products my family needs.",
    },
    name: "Driton H.",
    role: { al: "Prind", en: "Parent" },
  },
];
