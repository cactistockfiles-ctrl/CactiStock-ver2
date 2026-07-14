/**
 * Selects the optimal shipping box for a given set of small boxes
 * Tests each available box and selects based on utilization and size
 */

import { ShippingBox, SmallBox, PackingResult, PackingConfig, Layer } from './types';
import { LayerManager } from './LayerManager';

export class BoxSelector {
  /**
   * Try to pack all small boxes into a specific shipping box
   * Returns packing result if successful, null if all boxes cannot fit
   */
  static tryPackBox(
    smallBoxes: SmallBox[],
    shippingBox: ShippingBox,
    config: PackingConfig,
  ): PackingResult | null {
    // Calculate internal dimensions (accounting for box walls)
    const internalWidth = shippingBox.widthCm - 2;
    const internalLength = shippingBox.lengthCm - 2;
    const internalHeight = shippingBox.heightCm;

    const usableHeight =
      internalHeight - config.bottomFiller - config.topFiller;

    if (usableHeight <= 0) {
      return null;
    }

    const layers: Layer[] = [];
    const remainingBoxes = [...smallBoxes];
    let totalHeight = config.bottomFiller;

    // Pack layer by layer
    while (remainingBoxes.length > 0) {
      const isFirstLayer = layers.length === 0;

      const layerResult = LayerManager.packLayer(
        remainingBoxes,
        internalWidth,
        internalLength,
        layers.length + 1,
        config,
      );

      if (!layerResult) {
        // Cannot pack more boxes
        break;
      }

      const { placements, height } = layerResult;
      const packedCount = placements.length;

      // Check if this layer fits vertically
      const heightRequired =
        totalHeight + height + (isFirstLayer ? 0 : config.layerFiller);

      if (heightRequired + config.topFiller > internalHeight) {
        // Layer does not fit
        break;
      }

      // Create layer
      const layer = LayerManager.createLayer(
        layers.length + 1,
        placements,
        height,
        config,
        isFirstLayer,
      );

      layers.push(layer);

      // Remove packed boxes from remaining
      const packedIds = new Set(placements.map((p) => p.plantId));
      remainingBoxes.splice(0, packedCount);

      // Update total height
      totalHeight += height + config.layerFiller;
    }

    // Check if all boxes were packed
    if (remainingBoxes.length > 0) {
      return null;
    }

    // Calculate statistics
    const totalBoxesPacked = LayerManager.countPackedBoxes(layers);
    const usedVolume =
      internalWidth * internalLength * (totalHeight + config.topFiller);
    const boxVolume = shippingBox.volumeCm3;
    const freeVolume = boxVolume - usedVolume;
    const utilization = (usedVolume / boxVolume) * 100;

    const result: PackingResult = {
      shippingBox,
      layers,
      totalBoxesPacked,
      totalHeight: totalHeight + config.topFiller,
      usedVolume,
      freeVolume,
      utilization,
      // Backwards compatibility
      boxSize: shippingBox,
      totalCacti: totalBoxesPacked,
    };

    return result;
  }

  /**
   * Select the best shipping box from available options
   * Prioritizes: smallest box > highest utilization > lowest free volume
   */
  static selectBestBox(
    packingResults: PackingResult[],
  ): PackingResult | null {
    if (packingResults.length === 0) {
      return null;
    }

    // Sort by: smallest volume first, then highest utilization
    packingResults.sort((a, b) => {
      // Primary: smaller box volume
      if (a.shippingBox.volumeCm3 !== b.shippingBox.volumeCm3) {
        return a.shippingBox.volumeCm3 - b.shippingBox.volumeCm3;
      }
      // Secondary: higher utilization
      if (a.utilization !== b.utilization) {
        return b.utilization - a.utilization;
      }
      // Tertiary: lower free volume
      return a.freeVolume - b.freeVolume;
    });

    return packingResults[0];
  }
}
