// main.js

import { router } from "./router.js";
import { MainPage } from "./pages/mainPage.js";
import { PhotoBoothPage } from "./pages/photoBoothPage.js";

// =========================================================================
// 1. 전역 상태 (Global State)
// =========================================================================

/**
 * @private
 * @constant
 * @type {string}
 * 로컬 스토리지에 뷰어 데이터를 저장할 때 사용할 키.
 */
const LOCAL_STORAGE_KEY = 'webFourCutViewerData';

/**
 * @private
 * @type {MediaStream|null}
 * 현재 활성화된 웹캠 스트림 객체. PhotoBoothPage에서 생성되며, 라우트 전환 시 해제(cleanup)됨.
 */
let videoStream = null;

/**
 * @public
 * @type {string[]}
 * 촬영된 사진의 데이터 URL(Data URL) 목록. photo_utils.js에서 사용됨.
 */
export let capturedImages = [];

/**
 * @public
 * @type {string[]}
 * 뷰어 화면에서 보여줄 최종 압축 이미지 데이터 목록 (localStorage에 영구 저장됨).
 */
export let finalImagesViewer = [];

/**
 * @public
 * @constant
 * @type {number}
 * 한 번의 촬영 시퀀스에서 캡처할 사진의 총 개수.
 */
export const CAPTURE_COUNT = 4;

// =========================================================================
// 로컬 스토리지 데이터 관리
// =========================================================================

/**
 * 로컬 스토리지에서 뷰어 데이터를 불러와 finalImagesViewer 배열에 저장합니다.
 */
function loadViewerData() {
    try {
        const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedData) {
            finalImagesViewer.length = 0; // 배열 내용 초기화
            const parsedData = JSON.parse(storedData);
            if (Array.isArray(parsedData)) {
                // 배열 내용을 복사하여 참조를 유지합니다.
                finalImagesViewer.push(...parsedData);
            }
        }
    } catch (e) {
        console.error("로컬 스토리지 데이터 로드 오류:", e);
    }
}

/**
 * 현재 finalImagesViewer 배열의 내용을 로컬 스토리지에 저장합니다.
 */
export function saveViewerData() {
    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(finalImagesViewer));
    } catch (e) {
        // AppService가 초기화된 후에는 모달을 통해 메시지를 표시할 수 있습니다.
        if (AppService) {
             AppService.showAppMessage('저장 오류', '로컬 저장소 용량이 초과되었습니다. 일부 사진을 삭제해야 할 수 있습니다.', true);
        }
        console.error("로컬 스토리지 데이터 저장 오류:", e);
    }
}

loadViewerData();


// =========================================================================
// 2. AppService 객체 (전역 유틸리티 및 상태 접근자)
// =========================================================================

/**
 * @private
 * @type {HTMLElement}
 * HTML 문서에 정의된 모달 컨테이너 요소.
 */
const appModal = document.getElementById('app-modal');

/**
 * @public
 * @namespace
 * 애플리케이션 전체에서 공통으로 사용되는 유틸리티 함수와 전역 상태 접근자를 모아놓은 객체.
 */
export const AppService = {
    /**
     * 커스텀 모달에 메시지를 표시합니다.
     * @param {string} title - 모달의 제목.
     * @param {string} message - 모달에 표시할 내용.
     * @param {boolean} [isError=false] - 에러 메시지 여부 (제목 색상 변경).
     */
    showAppMessage(title, message, isError = false) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal-title').classList.toggle('text-red-600', isError);
        document.getElementById('modal-title').classList.toggle('text-blue-600', !isError);
        appModal.classList.remove('hidden');
        appModal.classList.add('flex');
    },
    
    /**
     * 표시된 커스텀 모달을 숨깁니다.
     */
    hideAppMessage() {
        appModal.classList.add('hidden');
        appModal.classList.remove('flex');
    },

    /**
     * #app 컨테이너에 로딩 스피너와 메시지를 표시합니다.
     * @param {string} [message='처리 중...'] - 로딩 메시지.
     */
    showLoading(message = '처리 중...') {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8">
                <div class="spinner mb-4"></div>
                <p class="text-xl text-gray-700">${message}</p>
            </div>
        `;
    },

    /**
     * 웹캠 스트림 객체를 전역 상태(videoStream)에 설정합니다.
     * @param {MediaStream} stream - 활성화된 웹캠 미디어 스트림.
     */
    setVideoStream(stream) {
        videoStream = stream;
    },

    /**
     * 전역 videoStream을 해제하고, 웹캠 사용을 중지합니다.
     */
    clearVideoStream() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            videoStream = null;
        }
    }
};


// =========================================================================
// 3. 초기화 및 라우팅 설정 (Initialization and Routing Configuration)
// =========================================================================

// 라우트 등록 (핵심 컴포넌트)
router.register('/main', MainPage);
router.register('/photo', PhotoBoothPage);

/**
 * 라우트 등록 (소개 페이지): 
 * 간단한 내용은 컴포넌트 파일을 따로 만들지 않고 main.js에서 인라인으로 정의합니다.
 */
router.register('/about', (container) => {
    // #app 컨테이너에 직접 HTML 삽입
    container.innerHTML = `
        <div class="p-8 text-center max-w-xl mx-auto">
            <h1 class="text-4xl font-extrabold mb-4 text-gray-800">소개</h1>
            <p class="text-lg text-gray-500">이 웹사이트는 웹캠 기반의 포토부스 기능을 구현한 프로젝트입니다.</p>
        </div>
    `;
    // cleanup 함수 반환: 페이지를 떠날 때 컨테이너를 비웁니다.
    return () => { container.innerHTML = ''; };
});

/**
 * 브라우저 로딩이 완료된 후 애플리케이션을 초기화합니다.
 */
window.onload = () => {
    const appElement = document.getElementById('app');
    
    // 모달 닫기 버튼에 AppService 유틸리티 함수 연결
    document.getElementById('modal-close-btn').addEventListener('click', AppService.hideAppMessage);

    if (appElement) {
        // 라우터 시스템 초기화 및 #app DOM 요소 전달
        router.init(appElement);
    }
    
    // 네비게이션 링크 클릭 이벤트 처리 (SPA 라우팅을 위해 기본 동작 방지)
    document.querySelectorAll('a[data-link]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // href 속성에서 해시(#) 부분을 제거하여 경로 추출
            const path = link.getAttribute('href').substring(1); 
            // 라우터 객체를 통해 경로 이동 요청
            router.navigate(path);
        });
    });
};


