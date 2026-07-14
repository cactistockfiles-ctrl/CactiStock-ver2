/**
 * Main packing engine that orchestrates the entire packing process
 * Converts plants into small boxes, tests them against all shipping boxes,
 * and returns the optimal packing solution
 */

import {
  Plant,
  ShippingBox,
  PackingConfig,
  PackingSolution,
  PackingResult,
} from './types';
import { SmallBoxGenerator } from './SmallBoxGenerator';
import { BoxSelector } from './BoxSelector';

export class PackingEngine {
  private config: PackingConfig;

  constructor(config: PackingConfig) {
    this.config = config;
  }

  /**
   * Main method: pack plants into the optimal shipping box(es)
   * Returns a solution containing one or more shipping boxes with detailed packing info
   */
  packPlants(
    plants: Plant[],
    shippingBoxes: ShippingBox[],
    allowMultipleBoxes: boolean = true,
  ): PackingSolution {
    // Step 1: Generate small boxes from plants
    const smallBoxes = SmallBoxGenerator.generateAllSmallBoxes(plants);

    if (smallBoxes.length === 0) {
      return {
        solutions: [],
        totalShippingBoxes: 0,
        totalUtilization: 0,
        totalUsedVolume: 0,
        totalFreeVolume: 0,
        isSuccessful: false,
      };
    }

    // Step 2: Try to pack into single box first
    const singleBoxSolutions: PackingResult[] = [];

    for (const shippingBox of shippingBoxes) {
      const result = BoxSelector.tryPackBox(
        smallBoxes,
        shippingBox,
        this.config,
      );

      if (result) {
        singleBoxSolutions.push(result);
      }
    }

    if (singleBoxSolutions.length > 0) {
      const bestBox = BoxSelector.selectBestBox(singleBoxSolutions);
      if (bestBox) {
        return {
          solutions: [bestBox],
          totalShippingBoxes: 1,
          totalUtilization: bestBox.utilization,
          totalUsedVolume: bestBox.usedVolume,
          totalFreeVolume: bestBox.freeVolume,
          isSuccessful: true,
        };
      }
    }

    // Step 3: If single box doesn't work and multiple boxes allowed, use multiple boxes
    if (!allowMultipleBoxes) {
      return {
        solutions: [],
        totalShippingBoxes: 0,
        totalUtilization: 0,
        totalUsedVolume: 0,
        totalFreeVolume: 0,
        isSuccessful: false,
      };
    }

    // Pack into multiple boxes
    const multiBoxSolution = this.packIntoMultipleBoxes(
      smallBoxes,
      shippingBoxes,
    );

    return multiBoxSolution;
  }

  /**
   * Pack small boxes into multiple shipping boxes
   * Uses a greedy approach: fill each box sequentially
   */
  private packIntoMultipleBoxes(
    smallBoxes: any[],
    shippingBoxes: ShippingBox[],
  ): PackingSolution {
    const solutions: PackingResult[] = [];
    let remainingBoxes = [...smallBoxes];

    // Try each shipping box size
    for (const shippingBox of shippingBoxes) {
      while (remainingBoxes.length > 0) {
        const result = BoxSelector.tryPackBox(
          remainingBoxes,
          shippingBox,
          this.config,
        );

        if (!result) {
          break;
        }

        solutions.push(result);

        // Remove packed boxes from remaining
        const packedIds = new Set(
          result.layers
            .flatMap((l) => l.placements)
            .map((p) => p.plantId),
        );

        remainingBoxes = remainingBoxes.filter(
          (box) => !packedIds.has(box.plantId),
        );
      }

      if (remainingBoxes.length === 0) {
        break;
      }
    }

    const isSuccessful = remainingBoxes.length === 0;
    const totalUsedVolume = solutions.reduce((sum, s) => sum + s.usedVolume, 0);
    const totalFreeVolume = solutions.reduce((sum, s) => sum + s.freeVolume, 0);
    const totalUtilization = isSuccessful
      ? (totalUsedVolume / (totalUsedVolume + totalFreeVolume)) * 100
      : 0;

    return {
      solutions,
      totalShippingBoxes: solutions.length,
      totalUtilization,
      totalUsedVolume,
      totalFreeVolume,
      isSuccessful,
    };
  }

  /**
   * Update packing configuration
   */
  updateConfig(newConfig: Partial<PackingConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): PackingConfig {
    return { ...this.config };
  }
}
