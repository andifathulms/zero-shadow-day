/**
 * Indonesian city coordinates.
 *
 * A convenience, not a data dependency: every computation in this app runs
 * from latitude, longitude and date, and typed coordinates cover any place not
 * listed here (PRD §7). Nothing is fetched; this list ships in the bundle.
 *
 * Provincial capitals and the country's larger cities, sorted west to east.
 * Coordinates are city-centre positions to about a hundredth of a degree,
 * roughly a kilometre, and within two hundredths for the smaller towns. A kilometre of latitude moves a zero shadow day by
 * under a fiftieth of a day, so the listed dates are unaffected — but the
 * point of the app is that you can type your own coordinates.
 */

import type { Place } from '@/lib/zsd'

export interface City extends Place {
  readonly name: string
  /** Province or region, for disambiguation in the picker. */
  readonly region: string
  /** Indonesian time zone code implied by the offset. */
  readonly zone: 'WIB' | 'WITA' | 'WIT'
}

const wib = (name: string, region: string, latDeg: number, lonDeg: number): City => ({
  name,
  region,
  latDeg,
  lonDeg,
  offsetHours: 7,
  zone: 'WIB',
})

const wita = (name: string, region: string, latDeg: number, lonDeg: number): City => ({
  name,
  region,
  latDeg,
  lonDeg,
  offsetHours: 8,
  zone: 'WITA',
})

const wit = (name: string, region: string, latDeg: number, lonDeg: number): City => ({
  name,
  region,
  latDeg,
  lonDeg,
  offsetHours: 9,
  zone: 'WIT',
})

/** Ordered west to east by longitude, the way the subsolar band does not travel. */
export const INDONESIAN_CITIES: readonly City[] = [
  wib('Sabang', 'Aceh', 5.8933, 95.3214),
  wib('Banda Aceh', 'Aceh', 5.5483, 95.3238),
  wib('Lhokseumawe', 'Aceh', 5.1801, 97.1507),
  wib('Medan', 'Sumatera Utara', 3.5952, 98.6722),
  wib('Pematangsiantar', 'Sumatera Utara', 2.9595, 99.0687),
  wib('Bukittinggi', 'Sumatera Barat', -0.3056, 100.3692),
  wib('Padang', 'Sumatera Barat', -0.9471, 100.4172),
  wib('Dumai', 'Riau', 1.6666, 101.4474),
  wib('Pekanbaru', 'Riau', 0.5071, 101.4478),
  wib('Bengkulu', 'Bengkulu', -3.7928, 102.2608),
  wib('Lubuklinggau', 'Sumatera Selatan', -3.2967, 102.8617),
  wib('Jambi', 'Jambi', -1.6101, 103.6131),
  wib('Batam', 'Kep. Riau', 1.1301, 104.0529),
  wib('Tanjungpinang', 'Kep. Riau', 0.9186, 104.4552),
  wib('Palembang', 'Sumatera Selatan', -2.9761, 104.7754),
  wib('Bandar Lampung', 'Lampung', -5.3971, 105.2668),
  wib('Pangkalpinang', 'Kep. Bangka Belitung', -2.1316, 106.1169),
  wib('Serang', 'Banten', -6.1103, 106.1639),
  wib('Tangerang', 'Banten', -6.1783, 106.6319),
  wib('Depok', 'Jawa Barat', -6.4025, 106.7942),
  wib('Bogor', 'Jawa Barat', -6.5971, 106.806),
  wib('Jakarta', 'DKI Jakarta', -6.2088, 106.8456),
  wib('Bekasi', 'Jawa Barat', -6.2383, 106.9756),
  wib('Bandung', 'Jawa Barat', -6.9175, 107.6191),
  wib('Tanjung Pandan', 'Kep. Bangka Belitung', -2.7497, 107.6516),
  wib('Tasikmalaya', 'Jawa Barat', -7.3274, 108.2207),
  wib('Cirebon', 'Jawa Barat', -6.7063, 108.557),
  wib('Singkawang', 'Kalimantan Barat', 0.906, 108.9872),
  wib('Tegal', 'Jawa Tengah', -6.8694, 109.1402),
  wib('Purwokerto', 'Jawa Tengah', -7.4245, 109.2396),
  wib('Pontianak', 'Kalimantan Barat', -0.0263, 109.3425),
  wib('Pekalongan', 'Jawa Tengah', -6.8886, 109.6753),
  wib('Ketapang', 'Kalimantan Barat', -1.848, 109.972),
  wib('Magelang', 'Jawa Tengah', -7.4797, 110.2177),
  wib('Yogyakarta', 'DI Yogyakarta', -7.7956, 110.3695),
  wib('Semarang', 'Jawa Tengah', -6.9932, 110.4203),
  wib('Surakarta', 'Jawa Tengah', -7.5755, 110.8243),
  wib('Madiun', 'Jawa Timur', -7.6298, 111.5239),
  wib('Kediri', 'Jawa Timur', -7.848, 112.0178),
  wib('Malang', 'Jawa Timur', -7.9666, 112.6326),
  wib('Surabaya', 'Jawa Timur', -7.2575, 112.7521),
  wib('Sampit', 'Kalimantan Tengah', -2.5333, 112.95),
  wib('Jember', 'Jawa Timur', -8.1724, 113.7),
  wib('Palangka Raya', 'Kalimantan Tengah', -2.2136, 113.9108),
  wib('Banyuwangi', 'Jawa Timur', -8.2192, 114.3691),
  wita('Banjarmasin', 'Kalimantan Selatan', -3.3194, 114.5908),
  wita('Singaraja', 'Bali', -8.112, 115.0882),
  wita('Denpasar', 'Bali', -8.6705, 115.2126),
  wita('Mataram', 'Nusa Tenggara Barat', -8.5833, 116.1167),
  wita('Nusantara', 'Kalimantan Timur', -0.9971, 116.7),
  wita('Balikpapan', 'Kalimantan Timur', -1.2379, 116.8529),
  wita('Samarinda', 'Kalimantan Timur', -0.5022, 117.1536),
  wita('Tanjung Selor', 'Kalimantan Utara', 2.8375, 117.3661),
  wita('Sumbawa Besar', 'Nusa Tenggara Barat', -8.4932, 117.4203),
  wita('Bontang', 'Kalimantan Timur', 0.1333, 117.5),
  wita('Tarakan', 'Kalimantan Utara', 3.3, 117.6333),
  wita('Bima', 'Nusa Tenggara Barat', -8.4606, 118.7278),
  wita('Mamuju', 'Sulawesi Barat', -2.6748, 118.8885),
  wita('Makassar', 'Sulawesi Selatan', -5.1477, 119.4327),
  wita('Parepare', 'Sulawesi Selatan', -4.0135, 119.6255),
  wita('Palu', 'Sulawesi Tengah', -0.8917, 119.8707),
  wita('Labuan Bajo', 'Nusa Tenggara Timur', -8.4964, 119.8877),
  wita('Palopo', 'Sulawesi Selatan', -2.9925, 120.1969),
  wita('Waingapu', 'Nusa Tenggara Timur', -9.6567, 120.2641),
  wita('Ende', 'Nusa Tenggara Timur', -8.8432, 121.6623),
  wita('Maumere', 'Nusa Tenggara Timur', -8.6199, 122.2111),
  wita('Kendari', 'Sulawesi Tenggara', -3.9985, 122.5129),
  wita('Baubau', 'Sulawesi Tenggara', -5.4667, 122.6333),
  wita('Luwuk', 'Sulawesi Tengah', -0.9516, 122.7875),
  wita('Gorontalo', 'Gorontalo', 0.5435, 123.0568),
  wita('Kupang', 'Nusa Tenggara Timur', -10.1772, 123.607),
  wita('Manado', 'Sulawesi Utara', 1.4748, 124.8421),
  wita('Bitung', 'Sulawesi Utara', 1.4404, 125.1217),
  wit('Ternate', 'Maluku Utara', 0.7963, 127.3862),
  wit('Sofifi', 'Maluku Utara', 0.7372, 127.5588),
  wit('Ambon', 'Maluku', -3.6954, 128.1814),
  wit('Sorong', 'Papua Barat Daya', -0.8762, 131.2558),
  wit('Fakfak', 'Papua Barat', -2.9261, 132.2961),
  wit('Tual', 'Maluku', -5.6333, 132.75),
  wit('Manokwari', 'Papua Barat', -0.8615, 134.062),
  wit('Nabire', 'Papua Tengah', -3.3667, 135.4833),
  wit('Biak', 'Papua', -1.1766, 136.082),
  wit('Timika', 'Papua Tengah', -4.546, 136.8837),
  wit('Wamena', 'Papua Pegunungan', -4.0996, 138.9498),
  wit('Merauke', 'Papua Selatan', -8.4932, 140.4018),
  wit('Jayapura', 'Papua', -2.5333, 140.7167),
]

/** The northernmost and southernmost places in the list — the ends of the sweep. */
export const NORTHERNMOST = INDONESIAN_CITIES.reduce((a, b) => (b.latDeg > a.latDeg ? b : a))
export const SOUTHERNMOST = INDONESIAN_CITIES.reduce((a, b) => (b.latDeg < a.latDeg ? b : a))

/** Default place when nothing has been chosen and geolocation has not been offered. */
export const DEFAULT_CITY: City =
  INDONESIAN_CITIES.find((city) => city.name === 'Jakarta') ?? INDONESIAN_CITIES[0]!

/** Case-insensitive substring search over name and region. Local, never a request. */
export function searchCities(query: string, limit = 8): City[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []
  return INDONESIAN_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(needle) || city.region.toLowerCase().includes(needle),
  ).slice(0, limit)
}

/**
 * The city nearest a coordinate, by great-circle distance — used only to name
 * a geolocated position for display. No request leaves the device (CLAUDE.md
 * invariant 9); this is the reverse geocoder, and it is a for-loop.
 */
export function nearestCity(latDeg: number, lonDeg: number): { city: City; km: number } {
  let best = { city: INDONESIAN_CITIES[0]!, km: Infinity }
  for (const city of INDONESIAN_CITIES) {
    const km = greatCircleKm(latDeg, lonDeg, city.latDeg, city.lonDeg)
    if (km < best.km) best = { city, km }
  }
  return best
}

/** Mean Earth radius, kilometres. The number Eratosthenes was after. */
export const EARTH_MEAN_RADIUS_KM = 6371.0088

export function greatCircleKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLon = (lon2 - lon1) * toRad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_MEAN_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** The UTC offset Indonesia uses at a longitude, when a user types coordinates. */
export function indonesianOffsetForLongitude(lonDeg: number): 7 | 8 | 9 {
  if (lonDeg < 112.5) return 7
  if (lonDeg < 127.5) return 8
  return 9
}
