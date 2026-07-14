/**
 * Generates small boxes from individual plants
 * Each plant gets its own small box with cardboard walls (1cm on each side)
 */

import { Plant, SmallBox } from './types';

export class SmallBoxGenerator {
  /**
   * Generate a small box for a single plant
   * Internal dimensions: D × D × H
   * External dimensions: (D+2) × (D+2) × (H+2)
   * where 2cm = 1cm cardboard on each side
   */
  static generateSmallBox(plant: Plant): SmallBox {
    const externalWidth = plant.diameterCm + 2;
    const externalLength = plant.diameterCm + 2;
    const externalHeight = plant.heightCm + 2;

    return {
      plantId: plant.id,
      plantName: plant.name,
      diameterCm: plant.diameterCm,
      plantHeightCm: plant.heightCm,
      widthCm: externalWidth,
      lengthCm: externalLength,
      heightCm: externalHeight,
      hasSpines: plant.hasSpines,
    };
  }

  /**
   * Generate small boxes for all plants (respecting quantity)
   */
  static generateAllSmallBoxes(plants: Plant[]): SmallBox[] {
    const smallBoxes: SmallBox[] = [];

    for (const plant of plants) {
      for (let i = 0; i < plant.quantity; i++) {
        smallBoxes.push(this.generateSmallBox(plant));
      }
    }

    return smallBoxes;
  }
}
