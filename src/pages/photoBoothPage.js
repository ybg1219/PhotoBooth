import { AppRouter } from '../main.js';
import { CAPTURE_COUNT } from '../main.js';
import { videoStream, setVideoStream } from '../main.js';
import { startShotSequence, handleFileSelection, updateFrameColor, downloadImage } from '../photo_utils.js'

/**
 * 웹캠 기반 '인생 네컷' 기능을 담당하는 페이지 컴포넌트입니다.
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소 (main #app)
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수
 */
export function PhotoPage(container) {
    
    const pageWrapper = document.createElement("div");
    pageWrapper.classList.add("photo-page-wrapper", "w-full", "h-full", "flex", "flex-col", "items-center", "justify-center");

    // --- 화면 렌더링 함수 (단계별) ---

    function renderStartScreen() {
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
                
                <button id="start-capture-btn" class="capture-button bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transition duration-200 w-full text-xl mb-4" aria-label="웹캠 촬영 시작">
                    📸 촬영 시작
                </button>
                
                <button id="upload-photo-btn" class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-6 rounded-full w-full text-lg" aria-label="사진 파일 4장 업로드">
                    파일 업로드 (${CAPTURE_COUNT}장)
                </button>
                <input type="file" id="photo-upload-input" accept="image/*" multiple style="display: none;">
            </div>
        `;

        pageWrapper.querySelector('#start-capture-btn').addEventListener('click', renderCaptureScreen);
        
        const uploadBtn = pageWrapper.querySelector('#upload-photo-btn');
        const uploadInput = pageWrapper.querySelector('#photo-upload-input');

        uploadBtn.addEventListener('click', () => uploadInput.click());
        uploadInput.addEventListener('change', (e) => handleFileSelection(e, renderResultScreen)); 
    }

    async function renderCaptureScreen() {
        // capturedImages.length = 0; // 유틸리티 함수에서 처리

        pageWrapper.innerHTML = `
            <div id="capture-container" class="p-4 bg-white rounded-xl shadow-2xl">
                <h2 class="text-2xl font-bold text-center mb-4 text-gray-700">포즈를 취해주세요!</h2>
                
                <div class="relative">
                    <video id="video-preview" autoplay playsinline muted class="rounded-lg"></video> 
                    <div id="countdown-overlay"></div>
                </div>

                <div id="thumbnails-container" class="flex justify-center gap-2 p-2 bg-gray-100 rounded-lg shadow-inner">
                    ${Array(CAPTURE_COUNT).fill(0).map((_, i) => 
                        `<div id="thumb-${i}" class="w-1/4 h-12 bg-gray-400 rounded-sm transition duration-300" style="opacity: 0.5;"></div>`
                    ).join('')}
                </div>

                <button id="start-shot-btn" class="capture-button bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full shadow-lg text-lg" aria-label="연속 촬영 시작">
                    촬영 시작 (${CAPTURE_COUNT}컷)
                </button>
                
                <button id="cancel-btn" class="text-sm text-gray-500 hover:text-gray-700 mt-2" aria-label="촬영 취소 및 홈으로 돌아가기">
                    취소하고 처음으로 돌아가기
                </button>
            </div>
        `;

        const video = pageWrapper.querySelector('#video-preview');
        const startBtn = pageWrapper.querySelector('#start-shot-btn');
        
        startBtn.addEventListener('click', () => {
            startBtn.disabled = true;
            startShotSequence(video, renderResultScreen, pageWrapper); 
        });
        pageWrapper.querySelector('#cancel-btn').addEventListener('click', renderStartScreen);

        // 1. 웹캠 스트림 시작
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user', 
                    width: { ideal: 1280 }, 
                    height: { ideal: 960 } 
                } 
            });
            setVideoStream(stream); // videoStream 상태 업데이트
            video.srcObject = videoStream;
            video.muted = true; 
            video.play();
        } catch (error) {
            console.error("웹캠 접근 오류:", error);
            startBtn.disabled = true;
            AppRouter.showAppMessage('카메라 접근 오류', '웹캠 접근에 실패했습니다. (HTTPS 환경 및 권한 확인 필요)', true);
            renderStartScreen();
        }
    }

    function renderResultScreen() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null); // videoStream 상태 업데이트
        }

        pageWrapper.innerHTML = `
            <div class="p-4 sm:p-8 bg-white rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-lg w-full">
                <h2 class="text-3xl font-bold text-center mb-2 text-gray-800">✨ 완성된 네컷 사진 ✨</h2>
                
                <div id="final-strip-container" class="my-4">
                    <canvas id="final-canvas"></canvas>
                </div>

                <div class="flex gap-4 mb-4">
                    <button id="frame-black-btn" data-color="black" class="frame-option-btn bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg shadow-md ring-2 ring-offset-2 ring-blue-500" aria-label="블랙 프레임 선택">
                        블랙 프레임
                    </button>
                    <button id="frame-white-btn" data-color="white" class="frame-option-btn bg-gray-100 text-gray-900 font-semibold py-2 px-4 rounded-lg shadow-md" aria-label="화이트 프레임 선택">
                        화이트 프레임
                    </button>
                </div>

                <button id="download-btn" class="capture-button bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg text-xl w-full" aria-label="이미지 파일 다운로드">
                    📥 이미지 다운로드
                </button>
                
                <button id="remake-btn" class="text-md text-gray-500 hover:text-gray-700 mt-2" aria-label="다시 만들기">
                    다시 만들기
                </button>
            </div>
        `;
        
        pageWrapper.querySelector('#download-btn').addEventListener('click', () => downloadImage(pageWrapper)); 
        pageWrapper.querySelector('#remake-btn').addEventListener('click', renderStartScreen);

        pageWrapper.querySelectorAll('.frame-option-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                updateFrameColor(color, pageWrapper); 
                pageWrapper.querySelectorAll('.frame-option-btn').forEach(b => b.classList.remove('ring-blue-500', 'ring-offset-2'));
                e.target.classList.add('ring-blue-500', 'ring-offset-2');
            });
        });

        updateFrameColor('black', pageWrapper);
    }
    
    renderStartScreen();
    container.appendChild(pageWrapper);
    
    // --- 정리 함수 반환 ---
    return () => {
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
            setVideoStream(null);
        }
        container.innerHTML = '';
    };
}
