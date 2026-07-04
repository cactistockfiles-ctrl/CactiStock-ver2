// Box size reference (from attachment)
export interface BoxSize {
  name: string; // e.g., "2A", "2B", "C", etc.
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  volumeCm3: number;
  priceThreshold: number; // Price per 5000 baht for reference
}

export const BOX_SIZES: BoxSize[] = [
  {
    name: "2A",
    widthCm: 14,
    lengthCm: 20,
    heightCm: 12,
    volumeCm3: 3360,
    priceThreshold: 0.672,
  },
  {
    name: "2B",
    widthCm: 17,
    lengthCm: 25,
    heightCm: 18,
    volumeCm3: 7650,
    priceThreshold: 1.53,
  },
  {
    name: "C",
    widthCm: 20,
    lengthCm: 30,
    heightCm: 11,
    volumeCm3: 6600,
    priceThreshold: 1.32,
  },
  {
    name: "D",
    widthCm: 22,
    lengthCm: 35,
    heightCm: 14,
    volumeCm3: 10780,
    priceThreshold: 2.156,
  },
  {
    name: "E",
    widthCm: 24,
    lengthCm: 40,
    heightCm: 17,
    volumeCm3: 16320,
    priceThreshold: 3.264,
  },
  {
    name: "F",
    widthCm: 30,
    lengthCm: 45,
    heightCm: 20,
    volumeCm3: 27000,
    priceThreshold: 5.4,
  },
  {
    name: "G",
    widthCm: 36,
    lengthCm: 31,
    heightCm: 26,
    volumeCm3: 29016,
    priceThreshold: 5.8032,
  },
  {
    name: "H",
    widthCm: 40,
    lengthCm: 45,
    heightCm: 35,
    volumeCm3: 63000,
    priceThreshold: 12.6,
  },
  {
    name: "I",
    widthCm: 45,
    lengthCm: 55,
    heightCm: 40,
    volumeCm3: 99000,
    priceThreshold: 19.8,
  },
];

export interface CactusPlant {
  id: string;
  name: string;
  sizeCm: number;
  widthCm?: number;
  lengthCm?: number;
  heightCm?: number;
  hasSpines: boolean;
  quantity: number;
}

export interface PackingDetail {
  boxSize: BoxSize;
  totalCacti: number;
  layers: LayerDetail[];
  spacingTopCm: number; // Tissue paper on top before closing
  spacingBottomCm: number; // Tissue paper at bottom
}

export interface LayerDetail {
  layerNumber: number;
  cactiInLayer: CactusPackingInfo[];
  spacingAboveCm: number; // Tissue paper above this layer
}

export interface CactusPackingInfo {
  id: string;
  name: string;
  originalSizeCm: number;
  paddingCm: number; // 1.5cm for no spines, 3cm for spines
  packedSizeCm: number; // originalSize + padding
  sizeSorted: number; // For sorting (largest first)
}

const TISSUE_PADDING_NO_SPINES = 1.5;
const TISSUE_PADDING_SPINES = 3;
const TISSUE_SPACING_BETWEEN_LAYERS = 5;
const TISSUE_SPACING_BOTTOM = 3;
const TISSUE_SPACING_TOP = 3;

export function calculatePackedDimensions(
  plant: CactusPlant,
): CactusPackingInfo {
  const padding = plant.hasSpines ? TISSUE_PADDING_SPINES : TISSUE_PADDING_NO_SPINES;
  const packedSize = plant.sizeCm + padding;

  return {
    id: plant.id,
    name: plant.name,
    originalSizeCm: plant.sizeCm,
    paddingCm: padding,
    packedSizeCm: packedSize,
    sizeSorted: packedSize, // Use packed size for sorting
  };
}

export function findOptimalBox(
  plants: CactusPlant[],
  allowMultipleBoxes: boolean = true,
): PackingDetail | PackingDetail[] {
  if (plants.length === 0) {
    throw new Error("No plants to pack");
  }

  // Calculate packed dimensions for each plant
  const packedPlants = plants
    .reduce<CactusPackingInfo[]>((acc, plant) => {
      for (let i = 0; i < plant.quantity; i++) {
        acc.push(calculatePackedDimensions(plant));
      }
      return acc;
    }, [])
    .sort((a, b) => b.sizeSorted - a.sizeSorted); // Sort largest first

  // Try to fit all plants in a single box
  const singleBoxSolution = tryFitInSingleBox(packedPlants);
  if (singleBoxSolution) {
    return singleBoxSolution;
  }

  // If multiple boxes allowed and single box doesn't work, split into multiple
  if (allowMultipleBoxes) {
    return tryFitInMultipleBoxes(packedPlants);
  }

  // If no solution found, throw error
  throw new Error("Cannot fit plants in available boxes");
}

function tryFitInSingleBox(plants: CactusPackingInfo[]): PackingDetail | null {
  for (const boxSize of BOX_SIZES) {
    const packing = canPackInBox(plants, boxSize);
    if (packing) {
      return packing;
    }
  }
  return null;
}

function canPackInBox(
  plants: CactusPackingInfo[],
  box: BoxSize,
): PackingDetail | null {
  // Calculate dimensions available for packing (considering tissue paper)
  const availableWidth = box.widthCm - 2; // 1cm margin on each side
  const availableLength = box.lengthCm - 2;
  const availableHeight = box.heightCm - TISSUE_SPACING_BOTTOM - TISSUE_SPACING_TOP;

  // Simple packing: arrange plants in a grid, layer by layer
  const layers: LayerDetail[] = [];
  let remainingPlants = [...plants];
  let currentHeight = TISSUE_SPACING_BOTTOM;
  let layerNumber = 0;

  while (remainingPlants.length > 0 && currentHeight < availableHeight) {
    layerNumber++;
    const maxPlantHeightInLayer = Math.max(
      ...remainingPlants.map((p) => p.packedSizeCm),
    );

    // Check if we can fit this layer
    if (currentHeight + maxPlantHeightInLayer > availableHeight) {
      break;
    }

    // Try to fit as many plants as possible in this layer
    const fittingPlants: CactusPackingInfo[] = [];
    const unfittingPlants: CactusPackingInfo[] = [];

    for (const plant of remainingPlants) {
      if (fittingPlants.length === 0 || canFitInLayer(fittingPlants, plant, availableWidth, availableLength)) {
        fittingPlants.push(plant);
      } else {
        unfittingPlants.push(plant);
      }
    }

    if (fittingPlants.length === 0) {
      break; // Can't fit any more plants
    }

    layers.push({
      layerNumber,
      cactiInLayer: fittingPlants,
      spacingAboveCm: layerNumber > 1 ? TISSUE_SPACING_BETWEEN_LAYERS : 0,
    });

    currentHeight += maxPlantHeightInLayer + TISSUE_SPACING_BETWEEN_LAYERS;
    remainingPlants = unfittingPlants;
  }

  // Check if all plants were packed
  if (remainingPlants.length > 0) {
    return null;
  }

  return {
    boxSize: box,
    totalCacti: plants.length,
    layers,
    spacingBottomCm: TISSUE_SPACING_BOTTOM,
    spacingTopCm: TISSUE_SPACING_TOP,
  };
}

function canFitInLayer(
  existing: CactusPackingInfo[],
  newPlant: CactusPackingInfo,
  width: number,
  length: number,
): boolean {
  // Simple approximation: assume circular/oval packing
  // Check if we can fit on the same layer
  const totalSize = existing.reduce((sum, p) => sum + p.packedSizeCm, 0) + newPlant.packedSizeCm;
  return totalSize <= Math.min(width, length);
}

function tryFitInMultipleBoxes(plants: CactusPackingInfo[]): PackingDetail[] {
  const solutions: PackingDetail[] = [];
  let remainingPlants = [...plants];

  // Try progressively larger boxes
  for (const boxSize of BOX_SIZES) {
    while (remainingPlants.length > 0) {
      const packing = canPackInBox(remainingPlants, boxSize);
      if (packing) {
        solutions.push(packing);
        // Remove packed plants from remaining
        const packedIds = new Set(packing.layers.flatMap((l) => l.cactiInLayer.map((c) => c.id)));
        remainingPlants = remainingPlants.filter((p) => !packedIds.has(p.id));
      } else {
        break;
      }
    }

    if (remainingPlants.length === 0) {
      break;
    }
  }

  if (remainingPlants.length > 0) {
    throw new Error("Cannot pack all plants in available boxes");
  }

  return solutions;
}
