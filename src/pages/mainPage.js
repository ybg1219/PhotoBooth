import { router } from "../router.js";
import { PhotoBoothPage } from "./photoBoothPage.js";

export function MainPage() {
  const container = document.createElement("div");
  container.classList.add("main-page");

  container.innerHTML = `
    <header class="header">
      <h1 class="title">📸 MyLife4Cut</h1>
      <p class="subtitle">당신의 하루를 네컷으로 담아보세요.</p>
    </header>
    <section class="preview">
      <img src="./src/assets/frames/sample.png" alt="sample" class="sample-frame" />
    </section>
    <footer class="actions">
      <button id="shootBtn" class="shoot-btn">촬영하기</button>
    </footer>
  `;

  container.querySelector("#shootBtn").addEventListener("click", () => {
    router.navigate("/photo"); // ✅ 여기서는 함수 실행 X
  });

  return container;
}
