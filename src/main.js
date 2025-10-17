// main.js

import { router } from "./router.js";
import { MainPage } from "./pages/mainPage.js";
import { PhotoBoothPage } from "./pages/photoBoothPage.js";

// =========================================================================
// 1. 전역 상태 (photo_utils.js에서 사용)
// =========================================================================
export let videoStream = null;
export let capturedImages = [];
export const CAPTURE_COUNT = 4;


// =========================================================================
// 2. AppRouter 객체 (유틸리티 함수 정의)
// =========================================================================
const appModal = document.getElementById('app-modal');

export const AppRouter = {
    // 유틸리티 함수: HTML의 모달 로직을 분리
    showAppMessage(title, message, isError = false) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-title').classList.toggle('text-red-600', isError);
        document.getElementById('modal-title').classList.toggle('text-blue-600', !isError);
        appModal.classList.remove('hidden');
        appModal.classList.add('flex');
    },
    
    hideAppMessage() {
        appModal.classList.add('hidden');
        appModal.classList.remove('flex');
    },

    showLoading(message = '처리 중...') {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8">
                <div class="spinner mb-4"></div>
                <p class="text-xl text-gray-700">${message}</p>
            </div>
        `;
    },

    // videoStream 상태 업데이트 함수 (PhotoBoothPage에서 사용)
    setVideoStream(stream) {
        videoStream = stream;
    },

    clearVideoStream() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
    }
};


// =========================================================================
// 3. 초기화 및 라우팅 설정
// =========================================================================

// 라우트 등록
router.register('/main', MainPage);
router.register('/photo', PhotoBoothPage);
router.register('/about', (container) => {
    // main.js에 직접 정의된 간단한 페이지
    container.innerHTML = `
        <div class="p-8 text-center max-w-xl mx-auto">
            <h1 class="text-4xl font-extrabold mb-4 text-gray-800">소개</h1>
            <p class="text-lg text-gray-500">이 웹사이트는 웹캠 기반의 포토부스 기능을 구현한 프로젝트입니다.</p>
        </div>
    `;
    return () => { container.innerHTML = ''; };
});

window.onload = () => {
    const appElement = document.getElementById('app');
    
    // 모달 닫기 버튼 이벤트 등록 (HTML에서 정의된 #modal-close-btn)
    document.getElementById('modal-close-btn').addEventListener('click', AppRouter.hideAppMessage);

    if (appElement) {
        router.init(appElement);
    }
    
    // 네비게이션 링크 클릭 이벤트 처리
    document.querySelectorAll('a[data-link]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.getAttribute('href').substring(1);
            router.navigate(path);
        });
    });
};