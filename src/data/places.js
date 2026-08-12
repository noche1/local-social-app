// 시설 데이터는 candidates.js(시군별 · 카테고리별 후보 목록)에 있고,
// 이 파일은 카테고리 정의와 "표시할 시설 고르기" 로직을 담당한다.
// - 학교 미설정: 각 카테고리의 기본(첫 번째) 후보 → 시군 대표 시설
// - 학교 설정: 각 카테고리에서 우리 학교에 가장 가까운 후보
import { CANDIDATES_BY_CITY } from './candidates'
import { distanceMeters } from '../lib/geo'

export const CHUNGNAM_CENTER = { lat: 36.52, lng: 126.85 }

export const CATEGORIES = {
  post: { label: '우체국', icon: '✉️' },
  fire: { label: '소방서', icon: '🚒' },
  police: { label: '경찰서', icon: '🚓' },
  hospital: { label: '병원', icon: '🏥' },
  center: { label: '행정복지센터', icon: '🏢' },
  health: { label: '보건소', icon: '💉' },
  school: { label: '학교', icon: '🏫' },
  library: { label: '도서관', icon: '📚' },
  gym: { label: '체육관', icon: '🏀' },
  station: { label: '기차역', icon: '🚉' },
  terminal: { label: '버스터미널', icon: '🚌' },
  theater: { label: '공연장', icon: '🎭' },
  park: { label: '공원', icon: '🌳' },
}

// 3학년 사회 교과서(우리 생활에 도움을 주는 장소)의 4분류 기준.
// 결과 화면에서 이 분류표대로 실제로 확인한 장소 이름을 묶어 보여준다.
export const CATEGORY_GROUPS = [
  { label: '안전하고 편리한 생활을 돕는 장소', categories: ['post', 'fire', 'police', 'center', 'station', 'terminal'] },
  { label: '건강한 생활을 돕는 장소', categories: ['hospital', 'health'] },
  { label: '교육과 문화생활을 돕는 장소', categories: ['school', 'library', 'theater'] },
  { label: '놀이와 여가 생활을 돕는 장소', categories: ['gym', 'park'] },
]

// 충남 15개 시군. ready: true인 곳만 시설 데이터가 채워져 있음
export const CITIES = [
  { id: 'cheonan', name: '천안시', lat: 36.8151313, lng: 127.1140382, ready: true },
  { id: 'gongju', name: '공주시', lat: 36.4467875, lng: 127.1191109, ready: true },
  { id: 'boryeong', name: '보령시', lat: 36.3572454, lng: 126.5783763, ready: true },
  { id: 'asan', name: '아산시', lat: 36.788298, lng: 127.0019212, ready: true },
  { id: 'seosan', name: '서산시', lat: 36.7849098, lng: 126.450364, ready: true },
  { id: 'nonsan', name: '논산시', lat: 36.1872353, lng: 127.0987445, ready: true },
  { id: 'gyeryong', name: '계룡시', lat: 36.2744671, lng: 127.2485191, ready: true },
  { id: 'dangjin', name: '당진시', lat: 36.8899526, lng: 126.6457659, ready: true },
  { id: 'geumsan', name: '금산군', lat: 36.1088987, lng: 127.4880517, ready: true },
  { id: 'buyeo', name: '부여군', lat: 36.2753132, lng: 126.9100207, ready: true },
  { id: 'seocheon', name: '서천군', lat: 36.07814, lng: 126.7027629, ready: true },
  { id: 'cheongyang', name: '청양군', lat: 36.4593453, lng: 126.8019828, ready: true },
  { id: 'hongseong', name: '홍성군', lat: 36.6012894, lng: 126.660802, ready: true },
  { id: 'yesan', name: '예산군', lat: 36.6808741, lng: 126.8450906, ready: true },
  { id: 'taean', name: '태안군', lat: 36.7456901, lng: 126.2980462, ready: true },
]

// 카테고리별 공통 설명 문구
const DESC = {
  post: '편지와 소포를 보내고 받을 수 있는 곳이에요.',
  fire: '불을 끄고 위험에 처한 사람을 구해주는 곳이에요.',
  police: '우리 동네의 안전을 지켜주는 곳이에요.',
  hospital: '아프거나 다쳤을 때 치료를 받는 곳이에요.',
  center: '주민등록등본 같은 서류를 떼 주고, 우리 동네 살림을 도와주는 곳이에요.',
  health: '예방주사를 맞고 건강을 지켜주는 곳이에요.',
  school: '친구들과 함께 공부하고 뛰어노는 곳이에요.',
  library: '책을 읽고 빌릴 수 있는 곳이에요.',
  gym: '운동을 하며 튼튼한 몸을 만드는 곳이에요.',
  station: '기차를 타고 먼 곳까지 갈 수 있는 곳이에요.',
  terminal: '버스를 타고 다른 고장으로 갈 수 있는 곳이에요.',
  theater: '공연과 연극을 볼 수 있는 곳이에요.',
  park: '나무와 꽃 사이에서 쉬고 뛰어놀 수 있는 곳이에요.',
}

// 시군의 표시용 시설 목록을 만든다.
// school({lat, lng})이 있으면 카테고리마다 학교에서 가장 가까운 후보를,
// 없으면 기본(첫 번째) 후보를 고른다.
export function getPlacesForCity(cityId, school) {
  const cats = CANDIDATES_BY_CITY[cityId]
  if (!cats) return []

  const places = []
  let id = 1
  for (const cat of Object.keys(CATEGORIES)) {
    const candidates = cats[cat]
    if (!candidates || candidates.length === 0) continue

    let choice
    if (cat === 'school' && school && school.name !== '내 위치') {
      // '학교' 카테고리는 후보 목록에서 고르지 않고, 우리 학교 자체를 그대로 쓴다.
      // (예전엔 ⭐ 우리 학교 마커와 별개로 "가장 가까운 다른 학교"가 학교 카테고리에 떠서 헷갈렸음)
      choice = {
        name: school.name,
        lat: school.lat,
        lng: school.lng,
        addr: school.addr || '',
        note: '우리가 다니는 학교예요! 로드뷰로 우리 학교 모습을 살펴볼까요?',
      }
    } else {
      choice = candidates[0]
      if (school) {
        let best = Infinity
        for (const c of candidates) {
          const d = distanceMeters(school.lat, school.lng, c.lat, c.lng)
          if (d < best) {
            best = d
            choice = c
          }
        }
      }
    }

    places.push({
      id: id++,
      name: choice.name,
      category: cat,
      lat: choice.lat,
      lng: choice.lng,
      description: `${choice.addr}. ${choice.note || DESC[cat]}`,
    })
  }
  return places
}
