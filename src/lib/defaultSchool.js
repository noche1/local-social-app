// 시군별 대표 학교(cityDefaultSchools.js)를 카카오 장소 검색으로 실제 좌표까지 찾아주는 유틸.
// '우리 학교'(localStorage)를 덮어쓰지 않는, 그 화면에서만 쓰는 임시 기준점이다.
import { CITY_DEFAULT_SCHOOL_NAME } from '../data/cityDefaultSchools'
import { loadKakaoMapSdk } from './kakaoLoader'
import { findCityIdAt } from './geo'

// 탭이 열려있는 동안은 같은 시군을 다시 검색하지 않도록 캐시
const cache = {}

export async function resolveDefaultSchool(cityId) {
  if (cache[cityId]) return cache[cityId]

  const queryName = CITY_DEFAULT_SCHOOL_NAME[cityId]
  if (!queryName) return null

  try {
    const kakao = await loadKakaoMapSdk()
    const places = new kakao.maps.services.Places()
    const data = await new Promise((resolve) => {
      places.keywordSearch(queryName, (data, status) => {
        resolve(status === kakao.maps.services.Status.OK ? data : [])
      })
    })
    // 같은 학교 이름이 전국에 여러 곳 있을 수 있어(예: '태안초등학교'가 경기 화성시에도 있음),
    // 검색 결과 중 실제로 이 시군 경계 안에 있는 곳만 골라야 한다.
    const inCity = data.filter((d) => findCityIdAt(Number(d.y), Number(d.x)) === cityId)
    // 카카오 검색 순위가 정확히 같은 이름인 결과보다 다른 학교를 앞세울 때가 있어
    // (예: '금산초등학교' 검색에 '금산중앙초등학교'가 먼저 나옴), 이름이 정확히 일치하는
    // 결과를 우선하고, 없을 때만 그 시군 안의 다른 결과로 대체한다.
    const result = inCity.find((d) => d.place_name === queryName) || inCity[0]
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
