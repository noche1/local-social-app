// 시군별 대표 학교(cityDefaultSchools.js)를 카카오 장소 검색으로 실제 좌표까지 찾아주는 유틸.
// '우리 학교'(localStorage)를 덮어쓰지 않는, 그 화면에서만 쓰는 임시 기준점이다.
import { CITY_DEFAULT_SCHOOL_NAME } from '../data/cityDefaultSchools'
import { loadKakaoMapSdk } from './kakaoLoader'

// 탭이 열려있는 동안은 같은 시군을 다시 검색하지 않도록 캐시
const cache = {}

export async function resolveDefaultSchool(cityId) {
  if (cache[cityId]) return cache[cityId]

  const queryName = CITY_DEFAULT_SCHOOL_NAME[cityId]
  if (!queryName) return null

  try {
    const kakao = await loadKakaoMapSdk()
    const places = new kakao.maps.services.Places()
    const result = await new Promise((resolve) => {
      places.keywordSearch(queryName, (data, status) => {
        resolve(status === kakao.maps.services.Status.OK && data.length > 0 ? data[0] : null)
      })
    })
    if (!result) return null

    const school = {
      name: result.place_name,
      lat: Number(result.y),
      lng: Number(result.x),
      cityId,
      addr: result.road_address_name || result.address_name || '',
    }
    cache[cityId] = school
    return school
  } catch {
    return null
  }
}
