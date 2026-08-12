let sdkPromise = null

export function loadKakaoMapSdk() {
  if (window.kakao && window.kakao.maps) {
    return Promise.resolve(window.kakao)
  }

  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const key = import.meta.env.VITE_KAKAO_MAP_KEY
    if (!key) {
      reject(new Error('VITE_KAKAO_MAP_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.'))
      return
    }

    const script = document.createElement('script')
    script.id = 'kakao-map-sdk'
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`
    script.onload = () => {
      window.kakao.maps.load(() => resolve(window.kakao))
    }
    script.onerror = () => {
      sdkPromise = null
      reject(new Error('카카오맵 SDK 로드에 실패했습니다. 키 또는 네트워크를 확인하세요.'))
    }
    document.head.appendChild(script)
  })

  return sdkPromise
}
