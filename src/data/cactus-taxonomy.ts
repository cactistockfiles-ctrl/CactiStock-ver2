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
    "Ariocarpus Lloydii",
    "Ariocarpus Retusus",
    "Ariocarpus Fissuratus",
    "Ariocarpus Trigonus",
    "Ariocarpus Furfuraceus",
    "Ariocarpus Trifinger",
    "Ariocarpus Maruibo",
    "Ariocarpus Cauliflower",
    "Ariocarpus Godzilla",
    "Ariocarpus Scaphirostris",
    "Ariocarpus Agavoides",
    "Ariocarpus Hintonii",
    "Ariocarpus Confusus",
    "Ariocarpus Kotschoubeyanus",
    "Ariocarpus Bravonus",
    "Ariocarpus Brevituberosus",
    "Ariocarpus Frumdosus",
    "Ariocarpus Lloydii Varigated",
    "Ariocarpus Retusus Varigated",
    "Ariocarpus Fissuratus Varigated",
    "Ariocarpus Trigonus Varigated",
    "Ariocarpus Furfuraceus Varigated",
    "Ariocarpus Trifinger Varigated",
    "Ariocarpus Maruibo Varigated",
    "Ariocarpus Cauliflower Varigated",
    "Ariocarpus Godzilla Varigated",
    "Ariocarpus Kotschoubeyanus Varigated",
    "Ariocarpus Scaphirostris Varigated",
    "Ariocarpus Hintonii Varigated",
    "Ariocarpus Frumdosus Varigated",
    "Ariocarpus Maruibo x",
    "Ariocarpus Fissuratus x",
    "Ariocarpus Cauliflower x",
    "Ariocarpus Frumdosus x",
    "Ariocarpus Lloydii x",
    "Ariocarpus Lloydii CV",
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
