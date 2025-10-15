import { router } from "../router.js";
import { MainPage } from "./mainPage.js";

export function PhotoBoothPage() {
  const container = document.createElement("div");
  container.classList.add("photo-page");

  container.innerHTML = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
    <meta charset="UTF-8">
    <title>인생네컷 촬영</title>
    <link rel="stylesheet" href="./css/photo.css">
    <script defer src="./js/router.js"></script>
    </head>
    <body>
    <header>
        <button id="back-btn">← 돌아가기</button>
        <h1>인생네컷 촬영</h1>
    </header>

    <main class="fourcut-container">
        <section class="frame-preview">
        <div class="film-frame" id="film-frame">
            <div class="photo-slot" data-index="0">+</div>
            <div class="photo-slot" data-index="1">+</div>
            <div class="photo-slot" data-index="2">+</div>
            <div class="photo-slot" data-index="3">+</div>
        </div>
        </section>

        <section class="controls">
        <input type="file" id="file-input" accept="image/*" multiple hidden>
        <button id="upload-btn">사진 업로드</button>
        <button id="reset-btn">초기화</button>
        </section>
    </main>
    </body>
    </html>

  `;

  document.addEventListener('DOMContentLoaded', () => {
    const uploadBtn = document.querySelector('#upload-btn');
    const fileInput = document.querySelector('#file-input');
    const resetBtn = document.querySelector('#reset-btn');
    const photoSlots = document.querySelectorAll('.photo-slot');

    let currentIndex = 0;

    // 🔹 업로드 버튼 클릭 시 파일 선택창 열기
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    // 🔹 파일 선택 시 미리보기
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;
        if (!files.length) return;

        Array.from(files).forEach((file) => {
        if (currentIndex >= photoSlots.length) return; // 네컷 제한
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            photoSlots[currentIndex].innerHTML = '';
            photoSlots[currentIndex].appendChild(img);
            currentIndex++;
        };
        reader.readAsDataURL(file);
        });
    });

    // 🔹 각 슬롯 클릭 시 교체
    photoSlots.forEach((slot, index) => {
        slot.addEventListener('click', () => {
        fileInput.click();
        currentIndex = index; // 클릭한 슬롯에 새 이미지 덮어쓰기
        });
    });

    // 🔹 초기화 버튼
    resetBtn.addEventListener('click', () => {
        photoSlots.forEach(slot => {
        slot.innerHTML = '+';
        });
        currentIndex = 0;
        fileInput.value = '';
    });
    });


  return container;
}
