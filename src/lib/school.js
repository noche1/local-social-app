// '우리 학교' 설정 (localStorage에 저장 — 교사가 한 번 지정하면 새로고침에도 유지)
// 형식: { name, lat, lng, cityId, addr? } — addr은 학교 검색으로 지정했을 때만 있음(내 위치는 없음).
// name이 '학교'일 때(내 위치가 아닐 때) getPlacesForCity가 '학교' 카테고리 마커 자체로 이 학교를 그대로 씀.
const KEY = 'ourSchool'

export function getSchool() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (typeof s?.lat === 'number' && typeof s?.lng === 'number' && s?.name && s?.cityId) return s
    return null
  } catch {
    return null
  }
}

export function setSchool(school) {
  localStorage.setItem(KEY, JSON.stringify(school))
}

export function clearSchool() {
  localStorage.removeItem(KEY)
}
