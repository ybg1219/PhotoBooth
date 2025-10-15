import { router } from "../router.js";
import { MainPage } from "./mainPage.js";

export function PhotoBoothPage() {
  const container = document.createElement("div");
  container.classList.add("photo-page");

  container.innerHTML = `
    <header class="photo-header">
      <button id="backBtn" class="back-btn">← 돌아가기</button>
      <h2>나만의 인생네컷 만들기</h2>
    </header>

    <main class="photo-main">
      <div class="frame-area">
        <p>여기에 네컷 미리보기가 표시됩니다.</p>
      </div>
      <div class="tool-area">
        <button>사진 업로드</button>
        <button>필터 적용</button>
        <button>저장하기</button>
      </div>
    </main>
  `;

  container.querySelector("#backBtn").addEventListener("click", () => {
    router.navigate("/", MainPage());
  });

  return container;
}
