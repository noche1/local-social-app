import { CITY_BOUNDARIES } from '../data/cityBoundaries'
import { BORDER_ANCHORS } from '../data/borderAnchors'

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

const METERS_PER_DEG_LAT = 111320
// 경계선이 단순화 버전이라 실제로는 시군 안인데 선 밖으로 살짝 벗어나는 지점이 있음
// (예: 아산 둔포면, 당진 삽교호/석문면, 서산 대산읍, 태안반도, 서천 해안가 등 돌출부).
// 가장 가까운 경계선까지 이 거리 안이면 그 시군으로 인정한다. 실제 데이터로 확인한
// 최악의 오차가 약 2km였어서 여유를 두고 2.5km로 잡음.
const BOUNDARY_SNAP_METERS = 2500

function toLocalXY(lat, lng, originLat) {
  const metersPerDegLng = METERS_PER_DEG_LAT * Math.cos((originLat * Math.PI) / 180)
  return { x: lng * metersPerDegLng, y: lat * METERS_PER_DEG_LAT }
}

// 점(lat,lng)에서 선분((lat1,lng1)-(lat2,lng2))까지의 최단 거리(m). 위경도를 그 지점
// 위도 기준의 평면 좌표로 근사 변환해 계산 — 수 km 안쪽 거리에선 오차가 무시할 만큼 작음.
function pointToSegmentMeters(lat, lng, lat1, lng1, lat2, lng2) {
  const p = toLocalXY(lat, lng, lat)
  const a = toLocalXY(lat1, lng1, lat)
  const b = toLocalXY(lat2, lng2, lat)
  const abx = b.x - a.x
  const aby = b.y - a.y
  const lenSq = abx * abx + aby * aby
  let t = lenSq === 0 ? 0 : ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq
  t = Math.max(0, Math.min(1, t))
  const cx = a.x + t * abx
  const cy = a.y + t * aby
  return Math.hypot(p.x - cx, p.y - cy)
}

function distanceToRingMeters(lat, lng, ring) {
  let min = Infinity
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const d = pointToSegmentMeters(lat, lng, ring[j][0], ring[j][1], ring[i][0], ring[i][1])
    if (d < min) min = d
  }
  return min
}

// 실제 행정경계와 폴리곤이 어긋나는 지역(천안아산역 일대, 내포신도시 일대)에서
// 이 거리 안이면 폴리곤 대신 가장 가까운 검증된 기준점(BORDER_ANCHORS)을 따른다.
const ANCHOR_SNAP_METERS = 1200

function nearestAnchorCityId(lat, lng) {
  let bestCityId = null
  let bestDist = Infinity
  for (const anchor of BORDER_ANCHORS) {
    const d = distanceMeters(lat, lng, anchor.lat, anchor.lng)
    if (d < bestDist) {
      bestDist = d
      bestCityId = anchor.cityId
    }
  }
  return bestDist <= ANCHOR_SNAP_METERS ? bestCityId : null
}

// 좌표가 충남의 어느 시군 안에 있는지 (없으면 null)
export function findCityIdAt(lat, lng) {
  // 천안↔아산, 홍성↔예산처럼 두 시군이 실제로 맞닿아 개발된 지역은 단순화된 폴리곤보다
  // 실제 주소로 검증해둔 기준점이 더 정확하므로 먼저 확인한다.
  const anchorCityId = nearestAnchorCityId(lat, lng)
  if (anchorCityId) return anchorCityId

  for (const [cityId, rings] of Object.entries(CITY_BOUNDARIES)) {
    if (rings.some((ring) => pointInRing(lat, lng, ring))) return cityId
  }

  // 어느 폴리곤 안에도 없으면, 가장 가까운 시군 경계선까지의 거리를 재서
  // 단순화 오차 범위(BOUNDARY_SNAP_METERS) 안이면 그 시군으로 본다.
  let bestCityId = null
  let bestDist = Infinity
  for (const [cityId, rings] of Object.entries(CITY_BOUNDARIES)) {
    for (const ring of rings) {
      const d = distanceToRingMeters(lat, lng, ring)
      if (d < bestDist) {
        bestDist = d
        bestCityId = cityId
      }
    }
  }
  return bestDist <= BOUNDARY_SNAP_METERS ? bestCityId : null
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
