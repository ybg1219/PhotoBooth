// Note: PhotoPage를 import하여 라우팅합니다.
import { PhotoPage } from './pages/photoBoothPage.js';

// --- 전역 상태 변수 및 상수 (EXPORT) ---
export let videoStream = null;s
export let capturedImages = [];
export const CAPTURE_COUNT = 4;
export const app = document.getElementById('app');
export const appModal = document.getElementById('app-modal');
let currentCleanup = null; // 정리 함수 관리

// videoStream의 상태를 PhotoPage에서 업데이트하기 위한 Setter
export function setVideoStream(stream) {
    videoStream = stream;
}

// 모달은 AppRouter의 메서드로 구현되어 유틸리티처럼 사용됩니다.
export const AppRouter = {
    init() {
        document.getElementById('modal-close-btn').addEventListener('click', AppRouter.hideAppMessage);
        window.addEventListener('hashchange', AppRouter.handleLocationChange);
        
        if (window.location.hash === '') {
            window.location.hash = '#/photo';
        }
        AppRouter.handleLocationChange();

        document.querySelectorAll('a[data-link]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('href').substring(1);
                window.location.hash = path;
            });
        });
    },

    handleLocationChange() {
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }

        app.innerHTML = '';
        const path = window.location.hash.substring(1).toLowerCase() || '/main';
        
        switch (path) {
            case '/photo':
                currentCleanup = PhotoPage(app);
                break;
            case '/about':
                currentCleanup = AppRouter.renderSimplePage('소개', '이 웹사이트는 유동 시뮬레이션과 웹캠 기반의 포토부스 기능을 결합한 실험적인 프로젝트입니다.', 'text-gray-700');
                break;
            case '/main':
            default:
                currentCleanup = AppRouter.renderSimplePage('메인 (유동 시뮬레이션)', '현재 유동 시뮬레이션 코드가 준비 중입니다. 웹캠 기능을 보시려면 "웹 네컷"을 클릭해 주세요.', 'text-gray-500');
                break;
        }
    },

    renderSimplePage(title, content, textColor) {
        app.innerHTML = `
            <div class="p-8 text-center max-w-xl mx-auto">
                <h1 class="text-4xl font-extrabold mb-4 text-gray-800">${title}</h1>
                <p class="text-lg ${textColor}">${content}</p>
            </div>
        `;
        return () => { app.innerHTML = ''; }; 
    },
    
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
        app.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8">
                <div class="spinner mb-4"></div>
                <p class="text-xl text-gray-700">${message}</p>
            </div>
        `;
    }
};

// 윈도우 로드시 AppRouter 초기화
window.onload = AppRouter.init;
