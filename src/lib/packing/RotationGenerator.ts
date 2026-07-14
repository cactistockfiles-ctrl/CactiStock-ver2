/**
 * Generates all possible orientations for a small box
 * A box with dimensions W×L×H can be placed in 6 ways (minus duplicates)
 * For example: 8×8×14 can be 8×8×14, 8×14×8, 14×8×8
 */

import { SmallBox, BoxOrientation } from './types';

export class RotationGenerator {
  /**
   * Get all unique orientations for a box
   * Treats width and length as interchangeable (horizontal plane)
   * Height must be the third dimension (vertical)
   */
  static generateOrientations(box: SmallBox): BoxOrientation[] {
    const dims = [box.widthCm, box.lengthCm, box.heightCm].sort((a, b) => b - a);
    const orientations = new Set<string>();
    const results: BoxOrientation[] = [];

    // Generate all permutations of the three dimensions
    const permutations = [
      [dims[0], dims[1], dims[2]],
      [dims[0], dims[2], dims[1]],
      [dims[1], dims[0], dims[2]],
      [dims[1], dims[2], dims[0]],
      [dims[2], dims[0], dims[1]],
      [dims[2], dims[1], dims[0]],
    ];

    for (const [w, l, h] of permutations) {
      const key = `${w}x${l}x${h}`;

      // Skip if we've already seen this orientation
      if (orientations.has(key)) {
        continue;
      }

      orientations.add(key);
      results.push({
        width: w,
        length: l,
        height: h,
        footprintArea: w * l,
        key,
      });
    }

    // Sort by footprint area (largest first) for better packing efficiency
    results.sort((a, b) => b.footprintArea - a.footprintArea);

    return results;
  }

  /**
   * Get the best orientation for horizontal packing (minimizes footprint)
   * This is useful for initial sorting
   */
  static getBestHorizontalOrientation(box: SmallBox): BoxOrientation {
    const orientations = this.generateOrientations(box);
    // Return the smallest footprint (last one since sorted descending)
    return orientations[orientations.length - 1];
  }

  /**
   * Get the orientation with largest footprint
   * Useful for sorting boxes from largest to smallest
   */
  static getLargestFootprintOrientation(box: SmallBox): BoxOrientation {
    const orientations = this.generateOrientations(box);
    return orientations[0];
  }
}
