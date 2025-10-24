// photoboothpage.js
import { AppService, CAPTURE_COUNT, capturedImages } from '../main.js';
import {
    startShotSequence,
    handleFileSelection,
    updateFrameColor,
    downloadImage
} from '../photo_utils.js';


/**
 * 웹캠 기반 '인생 네컷' 기능을 담당하는 페이지 컴포넌트입니다.
 * 컴포넌트의 라이프사이클과 화면 전환(Start -> Capture -> Result)을 관리합니다.
 * * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소 (#app).
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수.
 */
export function PhotoBoothPage(container) {
    // 로직 시작 전 전역 배열 초기화: 새 촬영을 위해 이전에 찍은 사진들을 지웁니다.
    capturedImages.length = 0;

    /** * @private
     * @type {HTMLElement}
     * 이 페이지의 모든 내용을 담을 최상위 DOM Wrapper.
     */
    const pageWrapper = document.createElement("div");
    pageWrapper.classList.add("photo-page-wrapper", "w-full", "h-full", "flex", "flex-col", "items-center", "justify-center");

    /**
     * @private
     * @type {Function|null}
     * startShotSequence에서 반환된 타이머 및 시퀀스 중지 cleanup 함수를 저장. 
     * 촬영 도중 취소하거나 페이지를 떠날 때 사용됨.
     */
    let currentCleanup = null;

    // -------------------------------------------------------------------------
    // --- 화면 렌더링 함수 (단계별) ---
    // -------------------------------------------------------------------------

    /**
     * @private
     * 촬영 프로세스의 첫 번째 단계: 시작 화면 (카메라 시작/파일 업로드 선택)을 렌더링합니다.
     */
    function renderStartScreen() {
        // 1. 촬영 시퀀스 정리: 혹시 남아있는 카운트다운 타이머를 중지합니다.
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }

        // 2. 웹캠 스트림 정리: 웹캠 사용을 중지하고 하드웨어 자원을 해제합니다.
        AppService.clearVideoStream();

        // 3. HTML 템플릿 로드
        pageWrapper.innerHTML = `
            <div class="p-8 text-center max-w-sm w-full mx-auto">
                <h1 class="text-5xl font-extrabold text-blue-600 mb-2">웹 네컷</h1>
                <p class="text-md text-gray-500 mb-10">온라인 포토부스에서 나만의 네컷을 만들어보세요!</p>
                
                <div id="frame-preview-box" class="w-48 h-64 mx-auto mb-12 bg-white p-2 rounded-lg shadow-xl border-4 border-black flex flex-col justify-between">
                    <div class="h-1/5 bg-gray-300 rounded-sm mb-1"></div>
                    <div class="h-1/5 bg-gray-300 rounded-sm mb-1"></div>
                    <div class="h-1/5 bg-gray-300 rounded-sm mb-1"></div>
                    <div class="h-1/5 bg-gray-300 rounded-sm"></div>
                </div>
                
                <button id="start-capture-btn" class="capture-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-200 w-full text-xl mb-4">
                    📸 촬영 시작
                </button>
                
                <button id="upload-photo-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-full w-full text-lg">
                    파일 업로드 (${CAPTURE_COUNT}장)
                </button>
                <input type="file" id="photo-upload-input" accept="image/*" multiple style="display: none;">
            </div>
        `;

        // 4. 이벤트 핸들러 등록
        pageWrapper.querySelector('#start-capture-btn').addEventListener('click', renderCaptureScreen);

        const uploadBtn = pageWrapper.querySelector('#upload-photo-btn');
        const uploadInput = pageWrapper.querySelector('#photo-upload-input');

        uploadBtn.addEventListener('click', () => uploadInput.click());
        // handleFileSelection 유틸리티에 결과 화면 렌더링 함수(renderResultScreen)를 콜백으로 전달
        uploadInput.addEventListener('change', (e) => handleFileSelection(e, renderResultScreen));
    }

    /**
     * @private
     * 촬영 프로세스의 두 번째 단계: 웹캠 미리보기 및 캡처 시퀀스 화면을 렌더링합니다.
     */
    async function renderCaptureScreen() {
        capturedImages.length = 0; // 새 촬영 시작 시 이미지 배열 초기화

        // 1. HTML 템플릿 로드 (웹캠 뷰, 썸네일, 버튼 포함)
        pageWrapper.innerHTML = `
            <div id="capture-container" class="p-4 bg-white rounded-xl shadow-2xl">
                <h2 class="text-2xl font-bold text-center mb-4 text-gray-700">포즈를 취해주세요!</h2>
                
                <div class="relative">
                    <video id="video-preview" autoplay playsinline muted class="rounded-lg transform scale-x-[-1]"></video>
                    <div id="countdown-overlay"></div>
                </div>

                <div id="thumbnails-container" class="flex justify-center gap-2 p-2 bg-gray-100 rounded-lg shadow-inner">
                    ${Array(CAPTURE_COUNT).fill(0).map((_, i) =>
            `<div id="thumb-${i}" class="w-1/4 h-12 bg-gray-400 rounded-sm transition duration-300" style="opacity: 0.5;"></div>`
        ).join('')}
                </div>

                <button id="start-shot-btn" class="capture-button bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full shadow-lg text-lg">
                    촬영 시작 (${CAPTURE_COUNT}컷)
                </button>
                
                <button id="cancel-btn" class="text-sm text-gray-500 hover:text-gray-700 mt-2">
                    취소하고 처음으로 돌아가기
                </button>
            </div>
        `;

        const video = pageWrapper.querySelector('#video-preview');
        const startBtn = pageWrapper.querySelector('#start-shot-btn');

        const handleStartShot = () => {
            startBtn.disabled = true;
            // startShotSequence 유틸리티를 호출하고, 시퀀스 중단 함수를 currentCleanup에 저장
            currentCleanup = startShotSequence(video, renderResultScreen, pageWrapper);
        };

        startBtn.addEventListener('click', handleStartShot);
        pageWrapper.querySelector('#cancel-btn').addEventListener('click', renderStartScreen);

        // 2. 웹캠 스트림 시작 (비동기)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } }
            });
            // AppService 통해 전역 videoStream 상태 업데이트 및 비디오 요소에 연결
            AppService.setVideoStream(stream);
            video.srcObject = stream;
            video.play();
        } catch (error) {
            // 3. 웹캠 접근 실패 시 에러 모달 표시 및 시작 화면으로 복귀
            console.error("웹캠 접근 오류:", error);
            startBtn.disabled = true;
            AppService.showAppMessage('카메라 접근 오류', '웹캠 접근에 실패했습니다. (HTTPS 환경 및 권한 확인 필요)', true);
            renderStartScreen();
        }
    }

    /**
     * @private
     * 촬영 프로세스의 세 번째 단계: 완성된 네컷 사진과 다운로드 옵션을 렌더링합니다.
     */
    function renderResultScreen() {
        // 1. 자원 정리 (촬영 시퀀스 및 웹캠)
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }
        AppService.clearVideoStream(); // 웹캠 스트림 중지

        // 2. HTML 템플릿 로드 (결과 이미지, 프레임 선택, 다운로드 버튼 포함)
        pageWrapper.innerHTML = `
            <div class="p-4 sm:p-8 bg-white rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-lg w-full">
                <h2 class="text-3xl font-bold text-center mb-2 text-gray-800">✨ 완성된 네컷 사진 ✨</h2>
                
                <div id="final-strip-container" class="my-4">
                    <canvas id="final-canvas"></canvas>
                </div>

                <div class="flex gap-4 mb-4">
                    <button id="frame-black-btn" data-color="black" class="frame-option-btn bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg shadow-md ring-2 ring-offset-2 ring-blue-500">
                        블랙 프레임
                    </button>
                    <button id="frame-white-btn" data-color="white" class="frame-option-btn bg-gray-100 text-gray-900 font-semibold py-2 px-4 rounded-lg shadow-md">
                        화이트 프레임
                    </button>
                    <button id="frame-purple-btn" data-color="purple" class="frame-option-btn bg-purple-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md" aria-label="퍼플 프레임 선택">
                        퍼플 프레임
                    </button>
                    <button id="frame-blue-btn" data-color="blue" class="frame-option-btn bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg shadow-md" aria-label="블루 프레임 선택">
                        블루 프레임
                    </button>
                </div>

                <button id="download-btn" class="capture-button bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg text-xl w-full">
                    📥 이미지 다운로드
                </button>
                <button id="viewer-btn" class="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-8 rounded-full shadow-lg text-xl w-full sm:w-1/2" aria-label="사진 뷰어 보기">
                    🖼️ 사진 뷰어
                </button>
                
                <button id="remake-btn" class="text-md text-gray-500 hover:text-gray-700 mt-2">
                    다시 만들기
                </button>
            </div>
        `;

        // 3. 이벤트 리스너 등록
        pageWrapper.querySelector('#download-btn').addEventListener('click', () => downloadImage(pageWrapper));
        pageWrapper.querySelector('#viewer-btn').addEventListener('click', renderViewerScreen); // 뷰어 버튼 연결
        pageWrapper.querySelector('#remake-btn').addEventListener('click', renderStartScreen);

        // 프레임 색상 변경 이벤트 처리
        pageWrapper.querySelectorAll('.frame-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                updateFrameColor(color, pageWrapper); // 유틸리티 함수 호출로 캔버스 재합성
                // 선택된 버튼에 스타일 적용 (ring)
                pageWrapper.querySelectorAll('.frame-option-btn').forEach(b => b.classList.remove('ring-blue-500', 'ring-offset-2'));
                e.target.classList.add('ring-blue-500', 'ring-offset-2');
            });
        });

        // 4. 초기 합성 시작 (기본: 블랙 프레임)
        updateFrameColor('purple', pageWrapper);
    }
    /**
     * @private
     * 촬영된 원본 사진들을 모아서 보여주는 뷰어 화면을 렌더링합니다.
     */
    function renderViewerScreen() {
        if (capturedImages.length === 0) {
            AppRouter.showAppMessage('사진 없음', '현재 저장된 사진이 없습니다. 먼저 촬영하거나 파일을 업로드해주세요.', true);
            renderResultScreen();
            return;
        }

        // 1. HTML 템플릿 로드 (사진 갤러리)
        pageWrapper.innerHTML = `
            <div class="p-4 sm:p-8 bg-white rounded-xl shadow-2xl flex flex-col items-center gap-6 max-w-4xl w-full h-full sm:h-auto overflow-y-auto">
                <h2 class="text-3xl font-bold text-center text-gray-800">📸 원본 사진 뷰어</h2>
                
                <div id="photo-gallery" class="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full p-4 bg-gray-100 rounded-lg">
                    ${capturedImages.map((dataUrl, index) => `
                        <div class="relative w-full aspect-square bg-gray-300 rounded-lg overflow-hidden shadow-md">
                            <img src="${dataUrl}" alt="Captured Photo ${index + 1}" class="w-full h-full object-cover transform scale-x-[-1]" />
                            <span class="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs font-bold px-2 py-1 rounded-full">
                                # ${index + 1}
                            </span>
                        </div>
                    `).join('')}
                </div>

                <button id="back-to-result-btn" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg text-lg" aria-label="결과 화면으로 돌아가기">
                    ← 결과 화면으로 돌아가기
                </button>
            </div>
        `;

        // 2. 이벤트 리스너 등록
        pageWrapper.querySelector('#back-to-result-btn').addEventListener('click', renderResultScreen);
    }

    // -------------------------------------------------------------------------
    // --- 컴포넌트 라이프사이클 (초기화 및 반환) ---
    // -------------------------------------------------------------------------

    // 초기 렌더링: 페이지 진입 시 Start 화면을 표시
    renderStartScreen();
    // 메인 라우터 컨테이너에 페이지의 DOM 요소를 부착
    container.appendChild(pageWrapper);

    /**
     * @returns {Function} 라우터가 페이지를 제거할 때 호출할 Cleanup 함수.
     */
    return () => {
        // 라우터 이동 시 웹캠 스트림과 타이머 모두 안전하게 정리
        AppService.clearVideoStream();
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }
        console.log('PhotoBoothPage cleanup 완료.');
    };
}