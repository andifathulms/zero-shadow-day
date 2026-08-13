/**
 * BMKG's published zero shadow day tables — the authoritative Indonesian source.
 *
 *   Kulminasi Utama I 2026  — the first crossing of 2026, as the sweep heads north
 *   https://content.bmkg.go.id/wp-content/uploads/kulminasi_utama_I_2026.pdf
 *
 *   Kulminasi Utama II 2025 — the second crossing of 2025, as it returns south
 *   https://content.bmkg.go.id/wp-content/uploads/kulminasi_2025_II.pdf
 *
 * Both tables give all 38 provincial capitals with BMKG's *own* coordinates in
 * degrees, minutes and seconds, and the culmination time to the second. The
 * coordinates are transcribed here exactly as printed, so a disagreement is a
 * disagreement about the astronomy and nothing else — not about where a city
 * centre is. The two tables list identical positions, so the cities are defined
 * once and the dates hang off them.
 *
 * Transcribed verbatim. These are the oracle: if the engine disagrees, the
 * engine is wrong (CLAUDE.md working style).
 */

export type Hemisphere = 'LU' | 'LS'
export type Zone = 'WIB' | 'WITA' | 'WIT'

export interface BmkgCity {
  readonly name: string
  /** Latitude as printed: degrees, minutes, seconds, hemisphere. */
  readonly lat: readonly [number, number, number, Hemisphere]
  /** Longitude as printed: degrees, minutes, seconds. All are east (BT). */
  readonly lon: readonly [number, number, number]
  readonly zone: Zone
}

export interface BmkgCulmination {
  readonly city: string
  readonly date: { readonly year: number; readonly month: number; readonly day: number }
  /** Local civil time as printed, "HH.MM.SS" in the city's own zone. */
  readonly time: readonly [number, number, number]
}

export const BMKG_CITIES: readonly BmkgCity[] = [
  { name: 'Banda Aceh', lat: [5, 33, 12.92, 'LU'], lon: [95, 19, 1.75], zone: 'WIB' },
  { name: 'Medan', lat: [3, 34, 30.79, 'LU'], lon: [98, 41, 14.14], zone: 'WIB' },
  { name: 'Padang', lat: [0, 55, 27.04, 'LS'], lon: [100, 21, 43.44], zone: 'WIB' },
  { name: 'Pekan baru', lat: [0, 31, 35.2, 'LU'], lon: [101, 27, 2.24], zone: 'WIB' },
  { name: 'Bengkulu', lat: [3, 48, 0.5, 'LS'], lon: [102, 15, 32.65], zone: 'WIB' },
  { name: 'Jambi', lat: [1, 35, 38.77, 'LS'], lon: [103, 36, 29.59], zone: 'WIB' },
  { name: 'Tanjung Pinang', lat: [0, 55, 40.38, 'LU'], lon: [104, 26, 34.23], zone: 'WIB' },
  { name: 'Palembang', lat: [2, 59, 16.45, 'LS'], lon: [104, 45, 37.27], zone: 'WIB' },
  { name: 'Bandar Lampung', lat: [5, 25, 45.63, 'LS'], lon: [105, 15, 35.67], zone: 'WIB' },
  { name: 'Pangkal Pinang', lat: [2, 7, 46.8, 'LS'], lon: [106, 6, 42.73], zone: 'WIB' },
  { name: 'Serang', lat: [6, 7, 0.01, 'LS'], lon: [106, 9, 22.95], zone: 'WIB' },
  { name: 'Jakarta Pusat', lat: [6, 10, 12.32, 'LS'], lon: [106, 49, 51.78], zone: 'WIB' },
  { name: 'Bandung', lat: [6, 55, 17.7, 'LS'], lon: [107, 36, 21.59], zone: 'WIB' },
  { name: 'Semarang', lat: [6, 59, 0.71, 'LS'], lon: [110, 26, 43.02], zone: 'WIB' },
  { name: 'Yogyakarta', lat: [7, 47, 10.53, 'LS'], lon: [110, 22, 8.94], zone: 'WIB' },
  { name: 'Surabaya', lat: [7, 20, 11.35, 'LS'], lon: [112, 42, 53.94], zone: 'WIB' },
  { name: 'Pontianak', lat: [0, 2, 28.94, 'LS'], lon: [109, 20, 10.9], zone: 'WIB' },
  { name: 'Palangka Raya', lat: [2, 13, 50.33, 'LS'], lon: [113, 53, 24.22], zone: 'WIB' },
  { name: 'Banjarbaru', lat: [3, 27, 40.43, 'LS'], lon: [114, 49, 27.95], zone: 'WITA' },
  { name: 'Samarinda', lat: [0, 30, 8.38, 'LS'], lon: [117, 7, 13.03], zone: 'WITA' },
  { name: 'Tanjungselor', lat: [2, 50, 38.02, 'LU'], lon: [117, 21, 53.81], zone: 'WITA' },
  { name: 'Denpasar', lat: [8, 39, 30.1, 'LS'], lon: [115, 12, 48.62], zone: 'WITA' },
  { name: 'Mataram', lat: [8, 34, 47.61, 'LS'], lon: [116, 6, 2.59], zone: 'WITA' },
  { name: 'Kupang', lat: [10, 9, 52.66, 'LS'], lon: [123, 34, 46.17], zone: 'WITA' },
  { name: 'Mamuju', lat: [2, 40, 29.8, 'LS'], lon: [118, 53, 18.14], zone: 'WITA' },
  { name: 'Makassar', lat: [5, 7, 49.51, 'LS'], lon: [119, 25, 11.03], zone: 'WITA' },
  { name: 'Palu', lat: [0, 53, 38.29, 'LS'], lon: [119, 51, 9.16], zone: 'WITA' },
  { name: 'Kendari', lat: [3, 57, 57.77, 'LS'], lon: [122, 30, 59.77], zone: 'WITA' },
  { name: 'Gorontalo', lat: [0, 32, 16.06, 'LU'], lon: [123, 3, 37.13], zone: 'WITA' },
  { name: 'Manado', lat: [1, 29, 15.96, 'LU'], lon: [124, 50, 35.14], zone: 'WITA' },
  { name: 'Sofifi', lat: [0, 44, 11.05, 'LU'], lon: [127, 33, 34.45], zone: 'WIT' },
  { name: 'Ambon', lat: [3, 41, 47.7, 'LS'], lon: [128, 10, 38.68], zone: 'WIT' },
  { name: 'Sorong', lat: [0, 52, 55.3, 'LS'], lon: [131, 16, 55.22], zone: 'WIT' },
  { name: 'Manokwari', lat: [0, 51, 45.48, 'LS'], lon: [134, 4, 21.25], zone: 'WIT' },
  { name: 'Jayapura', lat: [2, 32, 40.99, 'LS'], lon: [140, 41, 56.84], zone: 'WIT' },
  { name: 'Nabire', lat: [3, 21, 57.16, 'LS'], lon: [135, 29, 38.1], zone: 'WIT' },
  { name: 'Wamena', lat: [4, 5, 58.02, 'LS'], lon: [138, 56, 30.52], zone: 'WIT' },
  { name: 'Merauke', lat: [8, 29, 37.98, 'LS'], lon: [140, 24, 2.25], zone: 'WIT' },
]

/** Kulminasi Utama I 2026 — the northward crossing. */
export const BMKG_2026_FIRST: readonly BmkgCulmination[] = [
  { city: 'Banda Aceh', date: { year: 2026, month: 4, day: 4 }, time: [12, 41, 46] },
  { city: 'Medan', date: { year: 2026, month: 3, day: 29 }, time: [12, 30, 4] },
  { city: 'Padang', date: { year: 2026, month: 3, day: 18 }, time: [12, 26, 39] },
  { city: 'Pekan baru', date: { year: 2026, month: 3, day: 21 }, time: [12, 21, 8] },
  { city: 'Bengkulu', date: { year: 2026, month: 3, day: 11 }, time: [12, 21, 0] },
  { city: 'Jambi', date: { year: 2026, month: 3, day: 16 }, time: [12, 14, 15] },
  { city: 'Tanjung Pinang', date: { year: 2026, month: 3, day: 23 }, time: [12, 8, 52] },
  { city: 'Palembang', date: { year: 2026, month: 3, day: 13 }, time: [12, 10, 28] },
  { city: 'Bandar Lampung', date: { year: 2026, month: 3, day: 7 }, time: [12, 10, 0] },
  { city: 'Pangkal Pinang', date: { year: 2026, month: 3, day: 15 }, time: [12, 4, 31] },
  { city: 'Serang', date: { year: 2026, month: 3, day: 5 }, time: [12, 6, 53] },
  { city: 'Jakarta Pusat', date: { year: 2026, month: 3, day: 5 }, time: [12, 4, 11] },
  { city: 'Bandung', date: { year: 2026, month: 3, day: 3 }, time: [12, 1, 31] },
  { city: 'Semarang', date: { year: 2026, month: 3, day: 3 }, time: [11, 50, 10] },
  { city: 'Yogyakarta', date: { year: 2026, month: 2, day: 28 }, time: [11, 51, 4] },
  { city: 'Surabaya', date: { year: 2026, month: 3, day: 2 }, time: [11, 41, 18] },
  { city: 'Pontianak', date: { year: 2026, month: 3, day: 20 }, time: [11, 50, 11] },
  { city: 'Palangka Raya', date: { year: 2026, month: 3, day: 15 }, time: [11, 33, 24] },
  { city: 'Banjarbaru', date: { year: 2026, month: 3, day: 12 }, time: [12, 30, 29] },
  { city: 'Samarinda', date: { year: 2026, month: 3, day: 19 }, time: [12, 19, 21] },
  { city: 'Tanjungselor', date: { year: 2026, month: 3, day: 28 }, time: [12, 15, 41] },
  { city: 'Denpasar', date: { year: 2026, month: 2, day: 26 }, time: [12, 32, 3] },
  { city: 'Mataram', date: { year: 2026, month: 2, day: 26 }, time: [12, 28, 30] },
  { city: 'Kupang', date: { year: 2026, month: 2, day: 22 }, time: [11, 59, 10] },
  { city: 'Mamuju', date: { year: 2026, month: 3, day: 14 }, time: [12, 13, 42] },
  { city: 'Makassar', date: { year: 2026, month: 3, day: 7 }, time: [12, 13, 23] },
  { city: 'Palu', date: { year: 2026, month: 3, day: 18 }, time: [12, 8, 42] },
  { city: 'Kendari', date: { year: 2026, month: 3, day: 10 }, time: [12, 0, 15] },
  { city: 'Gorontalo', date: { year: 2026, month: 3, day: 22 }, time: [11, 54, 42] },
  { city: 'Manado', date: { year: 2026, month: 3, day: 24 }, time: [11, 46, 59] },
  { city: 'Sofifi', date: { year: 2026, month: 3, day: 22 }, time: [12, 36, 45] },
  { city: 'Ambon', date: { year: 2026, month: 3, day: 11 }, time: [12, 37, 21] },
  { city: 'Sorong', date: { year: 2026, month: 3, day: 18 }, time: [12, 23, 0] },
  { city: 'Manokwari', date: { year: 2026, month: 3, day: 18 }, time: [12, 11, 50] },
  { city: 'Jayapura', date: { year: 2026, month: 3, day: 14 }, time: [11, 46, 28] },
  { city: 'Nabire', date: { year: 2026, month: 3, day: 12 }, time: [12, 7, 49] },
  { city: 'Wamena', date: { year: 2026, month: 3, day: 10 }, time: [11, 54, 33] },
  { city: 'Merauke', date: { year: 2026, month: 2, day: 27 }, time: [11, 51, 8] },
]

/** Kulminasi Utama II 2025 — the southward return. */
export const BMKG_2025_SECOND: readonly BmkgCulmination[] = [
  { city: 'Banda Aceh', date: { year: 2025, month: 9, day: 8 }, time: [12, 36, 26] },
  { city: 'Medan', date: { year: 2025, month: 9, day: 13 }, time: [12, 21, 11] },
  { city: 'Padang', date: { year: 2025, month: 9, day: 25 }, time: [12, 10, 15] },
  { city: 'Pekan baru', date: { year: 2025, month: 9, day: 21 }, time: [12, 7, 17] },
  { city: 'Bengkulu', date: { year: 2025, month: 10, day: 2 }, time: [12, 0, 20] },
  { city: 'Jambi', date: { year: 2025, month: 9, day: 27 }, time: [11, 56, 35] },
  { city: 'Tanjung Pinang', date: { year: 2025, month: 9, day: 20 }, time: [11, 55, 41] },
  { city: 'Palembang', date: { year: 2025, month: 9, day: 30 }, time: [11, 50, 58] },
  { city: 'Bandar Lampung', date: { year: 2025, month: 10, day: 7 }, time: [11, 46, 49] },
  { city: 'Pangkal Pinang', date: { year: 2025, month: 9, day: 28 }, time: [11, 46, 14] },
  { city: 'Serang', date: { year: 2025, month: 10, day: 8 }, time: [11, 42, 56] },
  { city: 'Jakarta Pusat', date: { year: 2025, month: 10, day: 9 }, time: [11, 39, 58] },
  { city: 'Bandung', date: { year: 2025, month: 10, day: 11 }, time: [11, 36, 20] },
  { city: 'Semarang', date: { year: 2025, month: 10, day: 11 }, time: [11, 24, 58] },
  { city: 'Yogyakarta', date: { year: 2025, month: 10, day: 13 }, time: [11, 24, 47] },
  { city: 'Surabaya', date: { year: 2025, month: 10, day: 12 }, time: [11, 15, 39] },
  { city: 'Pontianak', date: { year: 2025, month: 9, day: 23 }, time: [11, 35, 3] },
  { city: 'Palangka Raya', date: { year: 2025, month: 9, day: 28 }, time: [11, 15, 8] },
  { city: 'Banjarbaru', date: { year: 2025, month: 10, day: 1 }, time: [12, 10, 24] },
  { city: 'Samarinda', date: { year: 2025, month: 9, day: 24 }, time: [12, 3, 35] },
  { city: 'Tanjungselor', date: { year: 2025, month: 9, day: 15 }, time: [12, 5, 47] },
  { city: 'Denpasar', date: { year: 2025, month: 10, day: 15 }, time: [12, 4, 57] },
  { city: 'Mataram', date: { year: 2025, month: 10, day: 15 }, time: [12, 1, 24] },
  { city: 'Kupang', date: { year: 2025, month: 10, day: 19 }, time: [11, 30, 40] },
  { city: 'Mamuju', date: { year: 2025, month: 9, day: 29 }, time: [11, 54, 48] },
  { city: 'Makassar', date: { year: 2025, month: 10, day: 6 }, time: [11, 50, 28] },
  { city: 'Palu', date: { year: 2025, month: 9, day: 25 }, time: [11, 52, 18] },
  { city: 'Kendari', date: { year: 2025, month: 10, day: 3 }, time: [11, 39, 0] },
  { city: 'Gorontalo', date: { year: 2025, month: 9, day: 21 }, time: [11, 40, 52] },
  { city: 'Manado', date: { year: 2025, month: 9, day: 19 }, time: [11, 34, 27] },
  { city: 'Sofifi', date: { year: 2025, month: 9, day: 21 }, time: [12, 22, 53] },
  { city: 'Ambon', date: { year: 2025, month: 10, day: 2 }, time: [12, 16, 41] },
  { city: 'Manokwari', date: { year: 2025, month: 9, day: 25 }, time: [11, 55, 26] },
  { city: 'Jayapura', date: { year: 2025, month: 9, day: 29 }, time: [11, 46, 25] },
  { city: 'Sorong', date: { year: 2025, month: 9, day: 25 }, time: [12, 6, 36] },
  { city: 'Nabire', date: { year: 2025, month: 10, day: 1 }, time: [12, 7, 46] },
  { city: 'Wamena', date: { year: 2025, month: 10, day: 3 }, time: [11, 54, 31] },
  { city: 'Merauke', date: { year: 2025, month: 10, day: 15 }, time: [11, 51, 16] },
]

/** Decimal degrees from the printed sexagesimal position. */
export function decimalLat(city: BmkgCity): number {
  const [degrees, minutes, seconds, hemisphere] = city.lat
  const magnitude = degrees + minutes / 60 + seconds / 3600
  return hemisphere === 'LU' ? magnitude : -magnitude
}

export function decimalLon(city: BmkgCity): number {
  const [degrees, minutes, seconds] = city.lon
  return degrees + minutes / 60 + seconds / 3600
}

/** Indonesia's zones as UTC offsets. No database: three meridians, no DST. */
export const ZONE_OFFSET: Record<Zone, number> = { WIB: 7, WITA: 8, WIT: 9 }

/** The printed culmination time as hours since local midnight. */
export function localHours(entry: BmkgCulmination): number {
  const [hours, minutes, seconds] = entry.time
  return hours + minutes / 60 + seconds / 3600
}
