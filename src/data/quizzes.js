// 탐험 완료 후 보여주는 카테고리별 퀴즈 문제 모음.
// 각 문제: { category, question, answer, choices }. choices엔 answer도 포함됨.
export const QUIZZES = [
  {
    category: 'post',
    question: '편지와 소포를 부치고 싶어요. 어디로 가야 할까요?',
    answer: '우체국',
    choices: ['우체국', '소방서', '도서관', '병원'],
  },
  {
    category: 'post',
    question: '우체국은 무슨 일을 하는 곳일까요?',
    answer: '편지와 소포를 보내고 받게 도와줘요',
    choices: ['편지와 소포를 보내고 받게 도와줘요', '불을 꺼줘요', '책을 빌려줘요', '아픈 사람을 치료해줘요'],
  },
  {
    category: 'fire',
    question: '불이 났어요! 어디에 도움을 요청해야 할까요?',
    answer: '소방서',
    choices: ['소방서', '우체국', '도서관', '버스터미널'],
  },
  {
    category: 'fire',
    question: '소방서는 무슨 일을 하나요?',
    answer: '불을 끄고 위험에 처한 사람을 구해줘요',
    choices: ['불을 끄고 위험에 처한 사람을 구해줘요', '편지를 배달해줘요', '아픈 동물을 치료해줘요', '기차를 운행해요'],
  },
  {
    category: 'police',
    question: '우리 동네가 안전한지 지켜주는 곳은 어디일까요?',
    answer: '경찰서',
    choices: ['경찰서', '도서관', '공원', '체육관'],
  },
  {
    category: 'police',
    question: '경찰서는 무슨 일을 하나요?',
    answer: '우리 동네의 안전을 지켜줘요',
    choices: ['우리 동네의 안전을 지켜줘요', '책을 빌려줘요', '소포를 배달해요', '운동을 가르쳐줘요'],
  },
  {
    category: 'hospital',
    question: '다치거나 아플 때는 어디로 가야 할까요?',
    answer: '병원',
    choices: ['병원', '도서관', '기차역', '공연장'],
  },
  {
    category: 'hospital',
    question: '병원은 무슨 일을 하나요?',
    answer: '아프거나 다쳤을 때 치료를 해줘요',
    choices: ['아프거나 다쳤을 때 치료를 해줘요', '소포를 배달해줘요', '책을 빌려줘요', '불을 꺼줘요'],
  },
  {
    category: 'health',
    question: '예방주사를 맞고 건강을 관리해주는 곳은 어디일까요?',
    answer: '보건소',
    choices: ['보건소', '경찰서', '버스터미널', '소방서'],
  },
  {
    category: 'health',
    question: '보건소는 무슨 일을 하나요?',
    answer: '예방주사를 맞고 건강을 지켜줘요',
    choices: ['예방주사를 맞고 건강을 지켜줘요', '범인을 잡아줘요', '기차를 운행해요', '편지를 배달해요'],
  },
  {
    category: 'center',
    question: '주민등록등본 같은 서류를 뗄 수 있는 곳은 어디일까요?',
    answer: '행정복지센터',
    choices: ['행정복지센터', '도서관', '체육관', '공연장'],
  },
  {
    category: 'center',
    question: '행정복지센터는 무슨 일을 하나요?',
    answer: '서류를 떼 주고 동네 살림을 도와줘요',
    choices: ['서류를 떼 주고 동네 살림을 도와줘요', '불을 꺼줘요', '책을 빌려줘요', '운동을 가르쳐줘요'],
  },
  {
    category: 'school',
    question: '친구들과 함께 공부하고 뛰어노는 곳은 어디일까요?',
    answer: '학교',
    choices: ['학교', '우체국', '병원', '기차역'],
  },
  {
    category: 'school',
    question: '학교는 무슨 일을 하는 곳인가요?',
    answer: '친구들과 함께 공부하고 뛰어놀아요',
    choices: ['친구들과 함께 공부하고 뛰어놀아요', '아픈 사람을 치료해요', '소포를 보내요', '기차를 태워줘요'],
  },
  {
    category: 'library',
    question: '책을 읽고 빌릴 수 있는 곳은 어디일까요?',
    answer: '도서관',
    choices: ['도서관', '소방서', '보건소', '버스터미널'],
  },
  {
    category: 'library',
    question: '도서관은 무슨 일을 하나요?',
    answer: '책을 읽고 빌릴 수 있게 해줘요',
    choices: ['책을 읽고 빌릴 수 있게 해줘요', '불을 꺼줘요', '버스를 태워줘요', '운동을 가르쳐줘요'],
  },
  {
    category: 'gym',
    question: '운동을 하며 튼튼한 몸을 만드는 곳은 어디일까요?',
    answer: '체육관',
    choices: ['체육관', '우체국', '도서관', '행정복지센터'],
  },
  {
    category: 'station',
    question: '기차를 타고 먼 곳까지 가고 싶어요. 어디로 가야 할까요?',
    answer: '기차역',
    choices: ['기차역', '버스터미널', '공연장', '공원'],
  },
  {
    category: 'terminal',
    question: '버스를 타고 다른 고장으로 가고 싶어요. 어디로 가야 할까요?',
    answer: '버스터미널',
    choices: ['버스터미널', '기차역', '경찰서', '학교'],
  },
  {
    category: 'theater',
    question: '공연과 연극을 볼 수 있는 곳은 어디일까요?',
    answer: '공연장',
    choices: ['공연장', '도서관', '병원', '소방서'],
  },
  {
    category: 'park',
    question: '나무와 꽃 사이에서 쉬고 뛰어놀 수 있는 곳은 어디일까요?',
    answer: '공원',
    choices: ['공원', '행정복지센터', '기차역', '우체국'],
  },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 탐험한 카테고리 중 카테고리 중복 없이 최대 count개 문제를 랜덤으로 고른다.
// 카테고리당 문제가 여러 개면 그중 하나만 랜덤으로 뽑고, 보기 순서도 섞는다.
export function pickQuizzes(exploredCategories, count = 5) {
  const categories = shuffle([...new Set(exploredCategories)])
  const picked = []
  for (const cat of categories) {
    if (picked.length >= count) break
    const pool = QUIZZES.filter((q) => q.category === cat)
    if (pool.length === 0) continue
    const q = pool[Math.floor(Math.random() * pool.length)]
    picked.push({ ...q, choices: shuffle(q.choices) })
  }
  return picked
}
