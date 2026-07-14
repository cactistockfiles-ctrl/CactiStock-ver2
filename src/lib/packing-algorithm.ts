/**
 * Intelligent Plant Box Packing Algorithm
 * 
 * This module provides high-level wrapper functions for backwards compatibility
 * while delegating to the new modular packing engine with MaxRects algorithm.
 * 
 * Key improvements:
 * - Uses MaxRects algorithm for actual 2D bin packing (not simple volume calculation)
 * - Supports box rotation to find optimal orientation
 * - Implements proper layer-based packing with filler material
 * - Modular architecture following SOLID principles
 * - Production-ready with comprehensive validation
 */

import {
  PackingEngine,
  Plant,
  ShippingBox,
  PackingConfig,
  PackingSolution,
  PackingResult,
} from './packing';

// Re-export for backwards compatibility
export type BoxSize = ShippingBox;

// Legacy plant format - support both old 'sizeCm' and new 'diameterCm' fields
export interface CactusPlant {
  id: string;
  name: string;
  sizeCm?: number; // Primary field used by legacy code
  diameterCm?: number; // Alternative field name
  heightCm?: number; // Optional height
  hasSpines: boolean;
  quantity: number;
  widthCm?: number; // Legacy field (deprecated)
  lengthCm?: number; // Legacy field (deprecated)
}

export type PackingDetail = PackingResult;
export type CactusPackingInfo = any; // Deprecated - use detailed placement info instead
export type LayerDetail = any; // Deprecated - use Layer from packing module

export interface PackingSettings extends PackingConfig {
  // Extends PackingConfig to support new format
  // Legacy fields (optional):
  tissuePaddingNoSpines?: number;
  tissuePaddingSpines?: number;
  tissueSpacingBetweenLayers?: number;
  tissueSpacingBottom?: number;
}

// Predefined shipping box sizes
export const BOX_SIZES: ShippingBox[] = [
  { name: "2A", widthCm: 14, lengthCm: 20, heightCm: 12, volumeCm3: 3360, priceThreshold: 0.672 },
  { name: "2B", widthCm: 17, lengthCm: 25, heightCm: 18, volumeCm3: 7650, priceThreshold: 1.53 },
  { name: "C", widthCm: 20, lengthCm: 30, heightCm: 11, volumeCm3: 6600, priceThreshold: 1.32 },
  { name: "CD", widthCm: 15, lengthCm: 15, heightCm: 15, volumeCm3: 3375, priceThreshold: 0.675 },
  { name: "C+8", widthCm: 20, lengthCm: 30, heightCm: 19, volumeCm3: 11400, priceThreshold: 2.28 },
  { name: "D", widthCm: 22, lengthCm: 35, heightCm: 14, volumeCm3: 10780, priceThreshold: 2.156 },
  { name: "D+11", widthCm: 22, lengthCm: 35, heightCm: 25, volumeCm3: 19250, priceThreshold: 3.85 },
  { name: "E", widthCm: 24, lengthCm: 40, heightCm: 17, volumeCm3: 16320, priceThreshold: 3.264 },
  { name: "M", widthCm: 27, lengthCm: 43, heightCm: 20, volumeCm3: 23220, priceThreshold: 4.644 },
  { name: "M+", widthCm: 35, lengthCm: 45, heightCm: 20, volumeCm3: 31500, priceThreshold: 6.3 },
  { name: "F", widthCm: 30, lengthCm: 45, heightCm: 20, volumeCm3: 27000, priceThreshold: 5.4 },
  { name: "ฉ", widthCm: 30, lengthCm: 45, heightCm: 22, volumeCm3: 29700, priceThreshold: 5.94 },
  { name: "G", widthCm: 36, lengthCm: 31, heightCm: 26, volumeCm3: 29016, priceThreshold: 5.8032 },
  { name: "7", widthCm: 35, lengthCm: 50, heightCm: 32, volumeCm3: 56000, priceThreshold: 11.2 },
  { name: "H", widthCm: 40, lengthCm: 45, heightCm: 35, volumeCm3: 63000, priceThreshold: 12.6 },
  { name: "L", widthCm: 40, lengthCm: 50, heightCm: 30, volumeCm3: 60000, priceThreshold: 12 },
  { name: "I", widthCm: 45, lengthCm: 55, heightCm: 40, volumeCm3: 99000, priceThreshold: 19.8 },
];

/**
 * Main packing function - backwards compatible interface
 * Converts legacy plant format to new format and uses MaxRects packing engine
 */
export function findOptimalBox(
  plants: CactusPlant[],
  allowMultipleBoxes: boolean = true,
  settings?: PackingSettings,
): PackingDetail | PackingDetail[] {
  // Convert packing settings to config
  const config: PackingConfig = {
    bottomFiller: settings?.tissueSpacingBottom ?? 2,
    topFiller: settings?.tissueSpacingBottom ?? 2,
    layerFiller: settings?.tissueSpacingBetweenLayers ?? 1,
  };

  // Convert legacy plant format to new Plant interface
  const newPlants: Plant[] = plants.map((plant) => {
    const diameter = plant.diameterCm ?? plant.sizeCm ?? 0;
    const height = plant.heightCm ?? diameter;
    return {
      id: plant.id,
      name: plant.name,
      diameterCm: diameter,
      heightCm: height,
      hasSpines: plant.hasSpines,
      quantity: plant.quantity,
    };
  });

  // Use the new packing engine
  const engine = new PackingEngine(config);
  const solution = engine.packPlants(newPlants, BOX_SIZES, allowMultipleBoxes);

  // Return results in the expected format
  if (solution.solutions.length === 0) {
    throw new Error("Cannot fit plants in available boxes");
  }

  if (solution.solutions.length === 1) {
    return solution.solutions[0];
  }

  return solution.solutions;
}
