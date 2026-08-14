/**
 * A simplified silhouette of the Indonesian archipelago, for visual
 * orientation behind the sweep map — so a city dot reads as "on Sumatra" or
 * "on Sulawesi" at a glance, rather than floating on a blank field.
 *
 * Hand-simplified from general knowledge of each island's outline, not
 * traced from a surveyed or licensed coastline dataset — consistent with the
 * project's no-data-dependency principle (CLAUDE.md invariant 3), the same
 * way `data/cities/indonesia.ts` is a bundled, hand-maintained list rather
 * than a fetched one. Coordinates are illustrative, not survey-grade: good
 * enough to recognize an island's shape and position, not to measure it.
 * Never treat these polygons as a source of truth for a place's coordinates.
 *
 * Each entry is one polygon, [lonDeg, latDeg] pairs, roughly ordered around
 * the island's perimeter.
 */
export const INDONESIA_ISLANDS: ReadonlyArray<ReadonlyArray<readonly [number, number]>> = [
  // Sumatra
  [
    [95.3, 5.5],
    [96.4, 5.2],
    [97.6, 4.3],
    [99.4, 3.4],
    [101.0, 2.0],
    [102.5, 1.4],
    [103.4, -0.2],
    [104.0, -2.3],
    [105.5, -4.6],
    [105.9, -5.6],
    [104.4, -5.1],
    [103.0, -3.9],
    [101.6, -2.2],
    [100.3, -0.4],
    [98.7, 1.6],
    [97.2, 3.2],
    [95.9, 4.4],
    [95.3, 5.5],
  ],
  // Java
  [
    [105.3, -6.4],
    [106.8, -5.9],
    [108.5, -6.4],
    [110.3, -6.8],
    [112.7, -7.1],
    [114.4, -8.2],
    [113.3, -8.5],
    [110.9, -8.1],
    [108.6, -7.6],
    [106.6, -7.0],
    [105.3, -6.4],
  ],
  // Kalimantan (Indonesian Borneo)
  [
    [109.1, 1.6],
    [108.7, -0.4],
    [109.4, -2.4],
    [111.2, -3.5],
    [114.1, -4.0],
    [116.0, -3.4],
    [117.6, -1.0],
    [118.6, 0.6],
    [119.1, 2.0],
    [117.6, 3.9],
    [115.5, 4.3],
    [113.0, 4.0],
    [110.6, 3.0],
    [109.1, 1.6],
  ],
  // Sulawesi — simplified spider shape; the peninsulas are the point
  [
    [120.0, -1.5],
    [123.0, 0.5],
    [124.8, 1.4],
    [123.9, 1.0],
    [122.3, -1.0],
    [123.3, -2.4],
    [122.6, -4.0],
    [121.8, -4.8],
    [120.3, -5.3],
    [119.4, -5.5],
    [119.0, -4.5],
    [119.6, -3.0],
    [118.8, -2.0],
    [119.4, -0.5],
    [120.0, -1.5],
  ],
  // Bali
  [
    [114.7, -8.15],
    [115.3, -8.1],
    [115.6, -8.4],
    [115.2, -8.75],
    [114.7, -8.55],
    [114.7, -8.15],
  ],
  // Lombok
  [
    [115.9, -8.35],
    [116.5, -8.35],
    [116.7, -8.85],
    [116.1, -8.9],
    [115.9, -8.35],
  ],
  // Sumbawa
  [
    [116.9, -8.4],
    [118.4, -8.35],
    [118.9, -8.75],
    [117.9, -9.0],
    [116.9, -8.75],
    [116.9, -8.4],
  ],
  // Flores
  [
    [119.9, -8.35],
    [121.5, -8.3],
    [122.9, -8.55],
    [122.9, -8.85],
    [121.0, -8.7],
    [119.9, -8.6],
    [119.9, -8.35],
  ],
  // Sumba
  [
    [119.2, -9.6],
    [120.3, -9.5],
    [120.4, -9.95],
    [119.3, -10.05],
    [119.2, -9.6],
  ],
  // Timor (Indonesian west half, drawn whole for silhouette purposes)
  [
    [123.5, -8.9],
    [124.6, -8.5],
    [125.0, -9.0],
    [124.8, -9.5],
    [123.9, -9.4],
    [123.5, -8.9],
  ],
  // Halmahera
  [
    [127.6, 1.7],
    [128.3, 1.2],
    [128.2, 0.2],
    [128.7, -0.6],
    [128.1, -0.9],
    [127.5, -0.1],
    [127.4, 0.9],
    [127.6, 1.7],
  ],
  // Seram
  [
    [128.9, -2.7],
    [130.3, -2.9],
    [131.2, -3.2],
    [130.2, -3.5],
    [128.9, -3.2],
    [128.9, -2.7],
  ],
  // Buru
  [
    [126.3, -3.1],
    [126.9, -3.15],
    [126.9, -3.55],
    [126.3, -3.5],
    [126.3, -3.1],
  ],
  // Papua (Indonesian west half of New Guinea)
  [
    [131.2, -1.0],
    [132.2, -0.2],
    [133.7, -0.4],
    [134.9, -1.4],
    [136.5, -1.9],
    [138.9, -2.3],
    [140.5, -2.6],
    [141.0, -2.6],
    [141.0, -9.1],
    [139.9, -8.3],
    [138.0, -6.3],
    [136.2, -4.3],
    [134.4, -3.3],
    [133.5, -3.5],
    [132.7, -2.4],
    [131.9, -1.9],
    [131.2, -1.0],
  ],
]
