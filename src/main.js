import { router } from "./router.js";
import { MainPage } from "./pages/mainPage.js";
import { PhotoBoothPage } from "./pages/photoBoothPage.js";

const app = document.querySelector("#app");

router.register("/", MainPage);
router.register("/photo", PhotoBoothPage);

// 초기 페이지 로드
// 페이지 로드 시 현재 경로 렌더링
window.addEventListener("DOMContentLoaded", () => {
  router.loadRoute(window.location.pathname || "/" );
});
// 브라우저 뒤로가기/앞으로가기 감지
window.addEventListener("popstate", () => {
  router.loadRoute(location.pathname);
});

// 초기 실행
router.navigate("/", MainPage());
