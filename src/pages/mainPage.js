// MainPage.js

import { router } from "../router.js";
// import { PhotoBoothPage } from "./photoBoothPage.js"; // 사용하지 않으므로 제거 가능

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

  // --- 이벤트 등록 ---
  const shootBtn = container.querySelector("#shootBtn");
  const handleShootClick = () => {
    router.navigate("/photo");
  };

  shootBtn.addEventListener("click", handleShootClick);

  // --- Cleanup 함수 정의 및 추가 ---
  const cleanup = () => {
    // 1. 이벤트 리스너 제거 (주요 작업)
    shootBtn.removeEventListener("click", handleShootClick);
    
    // 2. 이 페이지에는 정리할 외부 리소스(웹캠, 타이머 등)가 없으므로 추가 작업은 필요하지 않습니다.
    console.log('✅ MainPage cleanup 완료.');
  };

  // 반환하는 DOM 요소에 cleanup 함수를 속성으로 추가합니다.
  container.cleanup = cleanup;

  // DOM 요소를 반환합니다.
  return container;
}