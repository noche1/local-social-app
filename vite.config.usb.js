import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// USB제출용/program 전용 빌드 설정. 일반 vite.config.js(웹 배포용)는 건드리지 않는다.
// USB에서 index.html을 더블클릭해서 file://로 열면, 크롬 계열 브라우저가 보안상
// <script type="module">로 불러오는 외부 JS/CSS 파일 요청을 막아버려서 화면이 안 뜬다.
// vite-plugin-singlefile로 JS·CSS를 전부 index.html 안에 인라인으로 넣어서
// 외부 파일 요청 자체를 없애면, 서버 없이 더블클릭만으로도 정상 작동한다.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
})
