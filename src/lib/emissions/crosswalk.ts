// lib/emissions/crosswalk.ts
export const MCC_TO_NAICS_2017: Record<string, { naics: string; reason?: string }> = {
    // 🛒 Retail / Food
    "5411": { naics: "445110", reason: "Supermarkets & grocery" },
    "5812": { naics: "722511", reason: "Full-service restaurants" },
    "5814": { naics: "722513", reason: "Limited-service/fast food" },
    "5912": { naics: "446110", reason: "Pharmacies & drug stores" },
    "5331": { naics: "452319", reason: "Variety/general merchandise" },
    "5999": { naics: "452319", reason: "Misc specialty retail (proxy)" },
  
    // ✈️ Travel / Lodging / Mobility
    "4511": { naics: "481111", reason: "Passenger air transportation" },
    "3351": { naics: "532111", reason: "Car rental" },
    "7011": { naics: "721110", reason: "Hotels & motels" },
    "4789": { naics: "485310", reason: "Transportation services (taxi proxy)" },
  
    // 💻 Tech & Digital
    "5734": { naics: "443142", reason: "Software retail (rolled into electronics stores NAICS)" },
    "5732": { naics: "443142", reason: "Electronics stores" },
    "4814": { naics: "517311", reason: "Telecom carriers" },
    "5815": { naics: "454110", reason: "Digital goods media → e-commerce proxy" },
    "5964": { naics: "454110", reason: "Direct marketing/catalog → e-commerce" },
  
    // 🎭 Lifestyle
    "5941": { naics: "451110", reason: "Sporting goods stores" },
    "7298": { naics: "812199", reason: "Spas & personal care" },
    "5992": { naics: "453110", reason: "Florists" },
    "5942": { naics: "451211", reason: "Book stores" },
    "7832": { naics: "512131", reason: "Movie theaters" },
  };
  
  // Optional: a very safe fallback if an MCC isn’t in the table
  export const FALLBACK_NAICS = "454110"; // Electronic Shopping & Mail-Order Houses