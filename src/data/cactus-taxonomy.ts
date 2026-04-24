// Hierarchical taxonomy data for cacti
// Family → Species mapping
// This can be expanded by importing from Excel in the future

export const CACTUS_TAXONOMY: Record<string, string[]> = {
  "Gymnocalycium": [
    "Gymnocalycium mihanovichii",
    "Gymnocalycium baldianum",
    "Gymnocalycium denudatum",
    "Gymnocalycium horstii",
    "Gymnocalycium riojense",
    "Gymnocalycium stellatum",
  ],
  "Astrophytum": [
    "Astrophytum asterias",
    "Astrophytum capricorne",
    "Astrophytum myriostigma",
    "Astrophytum ornatum",
  ],
  "Mammillaria": [
    "Mammillaria elongata",
    "Mammillaria hahniana",
    "Mammillaria bocasana",
    "Mammillaria magnimamma",
    "Mammillaria parkinsonii",
  ],
  "Echinocactus": [
    "Echinocactus grusonii",
    "Echinocactus platyacanthus",
  ],
  "Opuntia": [
    "Opuntia ficus-indica",
    "Opuntia microdasys",
    "Opuntia santa-rita",
  ],
  "Melocactus": [
    "Melocactus bahiensis",
    "Melocactus intortus",
    "Melocactus matanzanus",
  ],
  "Ariocarpus": [
    "Ariocarpus retusus",
    "Ariocarpus trigonus",
    "Ariocarpus fissuratus",
    "Ariocarpus kotschoubeyanus",
  ],
};

// Get all family names
export function getFamilyNames(): string[] {
  return Object.keys(CACTUS_TAXONOMY);
}

// Get species names for a specific family
export function getSpeciesNames(family: string): string[] {
  return CACTUS_TAXONOMY[family] || [];
}
