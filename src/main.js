import { router } from "./router.js";
import { MainPage } from "./pages/mainPage.js";

const app = document.querySelector("#app");

// 초기 페이지 로드
router.loadRoute(location.pathname || "/");

// 브라우저 뒤로가기/앞으로가기 감지
window.addEventListener("popstate", () => {
  router.loadRoute(location.pathname);
});

// 초기 실행
router.navigate("/", MainPage());
