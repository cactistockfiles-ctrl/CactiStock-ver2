/**
 * MaxRects Bin Packing Algorithm
 * Implements the MaxRects algorithm for 2D rectangle packing
 * Finds the best free rectangle and places the next item there
 */

import { SmallBox, BoxOrientation, BoxPlacement } from './types';
import { RotationGenerator } from './RotationGenerator';

interface FreeRectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PackedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class MaxRectsPacker {
  private binWidth: number;
  private binHeight: number;
  private usedRectangles: PackedBox[] = [];
  private freeRectangles: FreeRectangle[] = [];

  constructor(binWidth: number, binHeight: number) {
    this.binWidth = binWidth;
    this.binHeight = binHeight;
    // Initialize with one big free rectangle covering entire bin
    this.freeRectangles.push({
      x: 0,
      y: 0,
      width: binWidth,
      height: binHeight,
    });
  }

  /**
   * Try to pack a box into the bin
   * Returns placement if successful, null otherwise
   */
  packBox(
    box: SmallBox,
    boxId: string,
    plantName: string,
  ): BoxPlacement | null {
    // Get all possible orientations for this box
    const orientations = RotationGenerator.generateOrientations(box);

    let bestPlacement: BoxPlacement | null = null;
    let bestFitScore = Infinity;

    // Try each orientation
    for (const orientation of orientations) {
      // Find best free rectangle for this orientation
      const placement = this.findBestRectangle(
        orientation.width,
        orientation.height,
      );

      if (placement) {
        // Calculate fit score (lower is better)
        const fitScore =
          placement.x * placement.x +
          placement.y * placement.y +
          Math.abs(placement.width - orientation.width) +
          Math.abs(placement.height - orientation.height);

        if (fitScore < bestFitScore) {
          bestFitScore = fitScore;
          bestPlacement = {
            boxId,
            plantId: box.plantId,
            plantName: plantName,
            x: placement.x,
            y: placement.y,
            width: orientation.width,
            length: box.lengthCm, // Keep original length for reference
            height: orientation.height,
            rotation: orientation.key,
          };
        }
      }
    }

    // If we found a placement, actually place it and update free rectangles
    if (bestPlacement) {
      this.placeRectangle(
        bestPlacement.x,
        bestPlacement.y,
        bestPlacement.width,
        bestPlacement.height,
      );
    }

    return bestPlacement;
  }

  /**
   * Find the best free rectangle that fits the given dimensions
   * Uses "Best Short Side Fit" heuristic
   */
  private findBestRectangle(
    width: number,
    height: number,
  ): FreeRectangle | null {
    let bestRect: FreeRectangle | null = null;
    let bestShortSideFit = Infinity;
    let bestLongSideFit = Infinity;

    for (const rect of this.freeRectangles) {
      // Check if box fits in this free rectangle
      if (rect.width >= width && rect.height >= height) {
        const leftoverHorizontal = rect.width - width;
        const leftoverVertical = rect.height - height;
        const shortSideFit = Math.min(leftoverHorizontal, leftoverVertical);
        const longSideFit = Math.max(leftoverHorizontal, leftoverVertical);

        if (
          shortSideFit < bestShortSideFit ||
          (shortSideFit === bestShortSideFit && longSideFit < bestLongSideFit)
        ) {
          bestShortSideFit = shortSideFit;
          bestLongSideFit = longSideFit;
          bestRect = rect;
        }
      }
    }

    return bestRect;
  }

  /**
   * Place a rectangle in the bin and update free rectangles
   */
  private placeRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    // Add to used rectangles
    this.usedRectangles.push({ x, y, width, height });

    // Remove the used rectangle from free list and split
    this.freeRectangles = this.freeRectangles.filter(
      (rect) =>
        !(
          rect.x === x &&
          rect.y === y &&
          rect.width === width &&
          rect.height === height
        ),
    );

    // Generate new free rectangles
    const newRects: FreeRectangle[] = [];

    // Try to create new free rectangles from the corners
    for (const rect of this.freeRectangles) {
      // Right side
      if (rect.x < x + width && rect.x + rect.width > x + width) {
        const newRect: FreeRectangle = {
          x: x + width,
          y: rect.y,
          width: rect.x + rect.width - (x + width),
          height: rect.height,
        };
        if (newRect.width > 0 && newRect.height > 0) {
          newRects.push(newRect);
        }
      }

      // Top side
      if (rect.y < y + height && rect.y + rect.height > y + height) {
        const newRect: FreeRectangle = {
          x: rect.x,
          y: y + height,
          width: rect.width,
          height: rect.y + rect.height - (y + height),
        };
        if (newRect.width > 0 && newRect.height > 0) {
          newRects.push(newRect);
        }
      }
    }

    // Merge overlapping rectangles and remove duplicates
    this.freeRectangles = this.mergeFreeRectangles([
      ...this.freeRectangles,
      ...newRects,
    ]);
  }

  /**
   * Merge overlapping and contained rectangles to minimize fragmentation
   */
  private mergeFreeRectangles(rects: FreeRectangle[]): FreeRectangle[] {
    if (rects.length === 0) return [];

    // Remove rectangles that are contained within others
    const filtered = rects.filter(
      (rect1) =>
        !rects.some(
          (rect2) =>
            rect1 !== rect2 &&
            rect2.x <= rect1.x &&
            rect2.y <= rect1.y &&
            rect2.x + rect2.width >= rect1.x + rect1.width &&
            rect2.y + rect2.height >= rect1.y + rect1.height,
        ),
    );

    // Remove duplicates
    const unique = filtered.filter(
      (rect, index, self) =>
        self.findIndex(
          (r) =>
            r.x === rect.x &&
            r.y === rect.y &&
            r.width === rect.width &&
            r.height === rect.height,
        ) === index,
    );

    return unique;
  }

  /**
   * Check if there are any free rectangles left
   */
  hasFreeSpace(): boolean {
    return this.freeRectangles.length > 0;
  }

  /**
   * Get total used area
   */
  getUsedArea(): number {
    return this.usedRectangles.reduce((sum, rect) => sum + rect.width * rect.height, 0);
  }

  /**
   * Get total bin area
   */
  getBinArea(): number {
    return this.binWidth * this.binHeight;
  }

  /**
   * Reset the packer for a new bin
   */
  reset(): void {
    this.usedRectangles = [];
    this.freeRectangles = [
      {
        x: 0,
        y: 0,
        width: this.binWidth,
        height: this.binHeight,
      },
    ];
  }
}
