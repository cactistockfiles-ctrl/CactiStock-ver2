/**
 * Core types and interfaces for the intelligent plant box packing engine
 */

/** Shipping box specifications */
export interface ShippingBox {
  name: string;
  widthCm: number;
  lengthCm: number;
  heightCm: number;
  volumeCm3: number;
  priceThreshold: number;
}

/** Individual plant specifications */
export interface Plant {
  id: string;
  name: string;
  diameterCm: number; // Circular canopy diameter
  heightCm: number;
  hasSpines: boolean;
  quantity: number;
}

/** Small box generated for a single plant (external dimensions with cardboard) */
export interface SmallBox {
  plantId: string;
  plantName: string;
  diameterCm: number;
  plantHeightCm: number;
  widthCm: number; // D + 2 (cardboard walls)
  lengthCm: number; // D + 2 (cardboard walls)
  heightCm: number; // H + 2 (cardboard walls)
  hasSpines: boolean;
}

/** Possible orientations for a small box */
export interface BoxOrientation {
  width: number;
  length: number;
  height: number;
  // Area on the horizontal plane
  footprintArea: number;
  // Identifier: "WxLxH"
  key: string;
}

/** Placement of a small box in a layer */
export interface BoxPlacement {
  boxId: string;
  plantId: string;
  plantName: string;
  x: number; // Position from left edge
  y: number; // Position from front edge
  width: number; // Chosen width
  length: number; // Chosen length
  height: number; // Chosen height (always the tallest)
  rotation: string; // Orientation key: "WxLxH"
}

/** Single layer within a shipping box */
export interface Layer {
  layerNumber: number;
  placements: BoxPlacement[];
  usedHeight: number; // Max height of boxes in this layer
  fillerBelow: number; // Filler thickness below (cm)
  fillerAbove: number; // Filler thickness above (cm)
  
  // Backwards compatibility properties
  cactiInLayer?: any[]; // Deprecated - use placements instead
  spacingAboveCm?: number; // Deprecated - use fillerAbove instead
}

/** Packing settings configuration */
export interface PackingConfig {
  bottomFiller: number; // cm
  topFiller: number; // cm
  layerFiller: number; // cm between layers
}

/** Packing result for a single shipping box */
export interface PackingResult {
  shippingBox: ShippingBox;
  layers: Layer[];
  totalBoxesPacked: number;
  totalHeight: number;
  usedVolume: number;
  freeVolume: number;
  utilization: number; // Percentage 0-100
  
  // Backwards compatibility properties
  boxSize?: ShippingBox; // Deprecated - use shippingBox instead
  totalCacti?: number; // Deprecated - use totalBoxesPacked instead
}

/** Final packing solution */
export interface PackingSolution {
  solutions: PackingResult[]; // Multiple shipping boxes if needed
  totalShippingBoxes: number;
  totalUtilization: number; // Average utilization
  totalUsedVolume: number;
  totalFreeVolume: number;
  isSuccessful: boolean;
}
