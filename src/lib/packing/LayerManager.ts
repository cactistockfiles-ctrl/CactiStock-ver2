/**
 * Manages packing of small boxes into layers within a shipping box
 * Handles layer height calculation, filler material, and layer validation
 */

import { SmallBox, Layer, BoxPlacement, PackingConfig } from './types';
import { MaxRectsPacker } from './MaxRectsPacker';
import { RotationGenerator } from './RotationGenerator';

export class LayerManager {
  /**
   * Pack boxes into a single layer within available width and length
   * Returns placement information and layer height
   */
  static packLayer(
    boxes: SmallBox[],
    availableWidth: number,
    availableLength: number,
    layerNumber: number,
    config: PackingConfig,
  ): { placements: BoxPlacement[]; height: number } | null {
    const packer = new MaxRectsPacker(availableWidth, availableLength);
    const placements: BoxPlacement[] = [];
    let maxHeight = 0;

    // Sort boxes by largest footprint first (for better packing)
    const sortedBoxes = [...boxes].sort((a, b) => {
      const orientA = RotationGenerator.getLargestFootprintOrientation(a);
      const orientB = RotationGenerator.getLargestFootprintOrientation(b);
      return orientB.footprintArea - orientA.footprintArea;
    });

    // Try to pack each box
    for (let i = 0; i < sortedBoxes.length; i++) {
      const box = sortedBoxes[i];
      const boxId = `${box.plantId}_${i}`;

      const placement = packer.packBox(box, boxId, box.plantName);

      if (placement) {
        placements.push(placement);
        maxHeight = Math.max(maxHeight, placement.height);
      } else {
        // If a box cannot be packed, this layer is full
        // Return only the successfully packed boxes
        break;
      }
    }

    if (placements.length === 0) {
      return null;
    }

    return {
      placements,
      height: maxHeight,
    };
  }

  /**
   * Calculate total height used by layers including fillers
   */
  static calculateTotalHeight(
    layers: Layer[],
    config: PackingConfig,
  ): number {
    let totalHeight = config.bottomFiller; // Bottom filler

    for (const layer of layers) {
      totalHeight += layer.usedHeight; // Box height
      totalHeight += config.layerFiller; // Filler between layers
    }

    totalHeight += config.topFiller; // Top filler

    return totalHeight;
  }

  /**
   * Validate that layers fit within the shipping box height
   */
  static validateHeight(
    layers: Layer[],
    shippingBoxHeight: number,
    config: PackingConfig,
  ): boolean {
    const totalHeight = this.calculateTotalHeight(layers, config);
    return totalHeight <= shippingBoxHeight;
  }

  /**
   * Create a properly formatted layer object
   */
  static createLayer(
    layerNumber: number,
    placements: BoxPlacement[],
    usedHeight: number,
    config: PackingConfig,
    isFirstLayer: boolean,
  ): Layer {
    const layer: Layer = {
      layerNumber,
      placements,
      usedHeight,
      fillerBelow: isFirstLayer ? config.bottomFiller : config.layerFiller,
      fillerAbove: config.layerFiller,
      // Backwards compatibility
      cactiInLayer: placements.map((p) => ({
        id: p.plantId,
        name: p.plantName,
        packedWidthCm: p.width,
        packedLengthCm: p.length,
        packedHeightCm: p.height,
      })),
      spacingAboveCm: config.layerFiller,
    };
    return layer;
  }

  /**
   * Calculate how many boxes were packed in layers
   */
  static countPackedBoxes(layers: Layer[]): number {
    return layers.reduce((sum, layer) => sum + layer.placements.length, 0);
  }
}
