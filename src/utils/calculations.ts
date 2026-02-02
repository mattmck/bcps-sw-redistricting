export const SCHOOL_COLORS = [
  '#4D4D4D',
  '#5DA5DA',
  '#FAA43A',
  '#60BD68',
  '#F17CB0',
  '#B2912F',
  '#B276B2',
  '#DECF3F',
  '#F15854'
]

export function distance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'M' | 'K' | 'N' = 'M'
): number {
  const radlat1 = (Math.PI * lat1) / 180
  const radlat2 = (Math.PI * lat2) / 180
  const theta = lon1 - lon2
  const radtheta = (Math.PI * theta) / 180
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta)
  dist = Math.acos(dist)
  dist = (dist * 180) / Math.PI
  dist = dist * 60 * 1.1515
  if (unit === 'K') {
    dist = dist * 1.609344
  }
  if (unit === 'N') {
    dist = dist * 0.8684
  }
  return dist
}

export function shadeColor(color: string, percent: number): string {
  const f = parseInt(color.slice(1), 16)
  const t = percent < 0 ? 0 : 255
  const p = percent < 0 ? percent * -1 : percent
  const R = f >> 16
  const G = (f >> 8) & 0x00ff
  const B = f & 0x0000ff
  return (
    '#' +
    (
      0x1000000 +
      (Math.round((t - R) * p) + R) * 0x10000 +
      (Math.round((t - G) * p) + G) * 0x100 +
      (Math.round((t - B) * p) + B)
    )
      .toString(16)
      .slice(1)
  )
}
