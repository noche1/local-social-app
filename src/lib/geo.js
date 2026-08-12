import { CITY_BOUNDARIES } from '../data/cityBoundaries'

// ring([lat,lng] 배열) 안에 점이 있는지 검사 (ray casting)
export function pointInRing(lat, lng, ring) {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [latI, lngI] = ring[i]
    const [latJ, lngJ] = ring[j]
    const intersect =
      latI > lat !== latJ > lat && lng < ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI
    if (intersect) inside = !inside
  }
  return inside
}

// 좌표가 충남의 어느 시군 안에 있는지 (없으면 null)
export function findCityIdAt(lat, lng) {
  for (const [cityId, rings] of Object.entries(CITY_BOUNDARIES)) {
    if (rings.some((ring) => pointInRing(lat, lng, ring))) return cityId
  }
  return null
}

// 두 좌표 사이 거리(m) — haversine
export function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const rad = Math.PI / 180
  const dLat = (lat2 - lat1) * rad
  const dLng = (lng2 - lng1) * rad
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

// (lat1,lng1)에서 (lat2,lng2)를 바라보는 나침반 방위각(0~360, 북쪽 기준 시계방향)
export function bearingDegrees(lat1, lng1, lat2, lng2) {
  const rad = Math.PI / 180
  const y = Math.sin((lng2 - lng1) * rad) * Math.cos(lat2 * rad)
  const x =
    Math.cos(lat1 * rad) * Math.sin(lat2 * rad) -
    Math.sin(lat1 * rad) * Math.cos(lat2 * rad) * Math.cos((lng2 - lng1) * rad)
  const deg = Math.atan2(y, x) / rad
  return (deg + 360) % 360
}

// (lat1,lng1)에서 (lat2,lng2) 방향으로 meters만큼 이동한 좌표 (목표를 넘어서지 않음)
export function moveToward(lat1, lng1, lat2, lng2, meters) {
  const d = distanceMeters(lat1, lng1, lat2, lng2)
  if (d < 1) return { lat: lat2, lng: lng2 }
  const f = Math.min(meters / d, 1)
  return { lat: lat1 + (lat2 - lat1) * f, lng: lng1 + (lng2 - lng1) * f }
}
