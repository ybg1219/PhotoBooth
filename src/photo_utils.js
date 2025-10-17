// photo_utils.js

// AppService 유틸리티 및 전역 상태 import
import { AppService, CAPTURE_COUNT, capturedImages } from './main.js';

/**
 * @public
 * @async
 * 지정된 초만큼 카운트다운을 화면에 표시하고 대기합니다.
 * @param {number} seconds - 카운트다운할 시간 (초).
 * @param {HTMLElement} pageWrapper - 카운트다운 오버레이를 포함하는 DOM 요소.
 * @returns {Promise<void>} 카운트다운이 완료된 후 해상되는 Promise.
 */
export async function countdown(seconds, pageWrapper) {
    const overlay = pageWrapper.querySelector('#countdown-overlay');
    if (!overlay) return; 

    overlay.classList.add('show');
    let timer = null; 

    return new Promise(resolve => {
        let count = seconds;
        overlay.innerHTML = count;

        timer = setInterval(() => {
            count--;
            if (count > 0) {
                overlay.innerHTML = count;
            } else if (count === 0) {
                overlay.innerHTML = '촬영!';
            } else {
                clearInterval(timer);
                // 촬영 메시지 표시 후 0.5초 대기
                setTimeout(() => {
                    overlay.classList.remove('show');
                    resolve();
                }, 500); 
            }
        }, 1000);
    }).finally(() => {
        // Promise가 해제(resolve)되거나 취소(reject)될 때 타이머를 정리
        if (timer) clearInterval(timer);
    });
}

/**
 * @public
 * 웹캠의 현재 프레임을 캡처하여 좌우 반전 후 썸네일과 전역 상태에 저장합니다.
 * @param {HTMLVideoElement} video - 현재 웹캠 스트림이 재생 중인 비디오 요소.
 * @param {number} shotIndex - 현재 촬영 순서 (0부터 시작).
 * @param {HTMLElement} pageWrapper - 썸네일 영역을 포함하는 DOM 요소.
 */
export function capturePhoto(video, shotIndex, pageWrapper) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 거울 모드 구현: 캔버스를 좌우 반전하여 사용자에게 보이는 그대로 캡처
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');
    // 전역 capturedImages 배열에 이미지 데이터 저장
    capturedImages.push(imageData); 
    
    // 썸네일 업데이트
    const thumb = pageWrapper.querySelector(`#thumb-${shotIndex}`);
    if (thumb) {
        thumb.style.backgroundImage = `url(${imageData})`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.opacity = '1';
        // 접근성을 위한 aria-label 업데이트 (선택 사항)
        document.getElementById('app').setAttribute('aria-label', `사진 ${shotIndex + 1} 캡처 완료`);
    }
}

/**
 * @public
 * 촬영 시작 버튼 클릭 시 호출되는 연속 촬영 시퀀스 로직입니다.
 * @param {HTMLVideoElement} video - 현재 웹캠 스트림이 재생 중인 비디오 요소.
 * @param {Function} renderResultScreen - 모든 촬영 완료 후 호출될 콜백 함수.
 * @param {HTMLElement} pageWrapper - 페이지의 최상위 DOM Wrapper.
 * @returns {Function} 촬영 시퀀스를 강제로 중지하는 cleanup 함수.
 */
export function startShotSequence(video, renderResultScreen, pageWrapper) {
    // CAPTURE_COUNT (전역 상수)를 사용
    const totalShots = CAPTURE_COUNT; 
    let isCancelled = false;
    let currentTimeout = null;
    
    /** 촬영 시퀀스 중단 함수 */
    const cleanup = () => {
        isCancelled = true;
        if (currentTimeout) clearTimeout(currentTimeout);
    };

    /** 촬영 루프를 비동기적으로 실행하는 내부 함수 */
    async function sequenceLoop() {
        for (let i = 0; i < totalShots; i++) {
            if (isCancelled) return;
            // 3초 카운트다운 후 촬영
            await countdown(3, pageWrapper); 
            
            if (isCancelled) return;
            capturePhoto(video, i, pageWrapper);
            
            // 마지막 컷이 아니면 다음 촬영을 위해 1초 대기
            if (i < totalShots - 1) {
                await new Promise(r => currentTimeout = setTimeout(r, 1000)); 
            }
            if (isCancelled) return;
        }
        // 모든 촬영이 끝나면 결과 화면 렌더링
        renderResultScreen();
    }
    
    sequenceLoop();
    return cleanup; 
}

/**
 * @public
 * 외부 파일을 선택했을 때 처리하며, 선택된 파일들을 순서대로 로드합니다.
 * @param {Event} event - 파일 선택(change) 이벤트 객체.
 * @param {Function} renderResultScreen - 모든 파일 로드 후 호출될 콜백 함수.
 */
export async function handleFileSelection(event, renderResultScreen) {
    const files = Array.from(event.target.files);
    // 선택된 파일 개수 검증 (CAPTURE_COUNT와 일치해야 함)
    if (files.length !== CAPTURE_COUNT) {
        AppService.showAppMessage('파일 오류', `정확히 ${CAPTURE_COUNT}장의 사진을 선택해야 합니다.`, true);
        return;
    }

    capturedImages.length = 0; // 배열 초기화
    
    AppService.showLoading('사진 파일을 순서대로 로딩 중입니다...');

    // await/for-of 루프를 사용하여 비동기 파일 로드를 순서대로 처리
    for (const file of files) {
        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                capturedImages.push(e.target.result);
                resolve();
            };
            reader.readAsDataURL(file);
        });
    }
    
    renderResultScreen();
}

/**
 * @public
 * 저장된 사진들을 캔버스에 합성하여 프레임을 생성하고 색상을 업데이트합니다.
 * @param {string} color - 프레임 색상 ('black' 또는 'white').
 * @param {HTMLElement} pageWrapper - 최종 캔버스를 포함하는 DOM 요소.
 */
export function updateFrameColor(color, pageWrapper) {
    // 캔버스 크기 관련 상수 (CAPTURE_COUNT에 종속적)
    const CANVAS_WIDTH = 500;
    const PADDING = 20;
    const GAP = 15;
    const LOGO_HEIGHT = 50;
    const PHOTO_WIDTH = CANVAS_WIDTH - PADDING * 2;
    const PHOTO_HEIGHT = (PHOTO_WIDTH / 4) * 3; // 4:3 비율 가정
    
    const TOTAL_HEIGHT = 
        (PADDING * 2) +
        (PHOTO_HEIGHT * CAPTURE_COUNT) + 
        (GAP * (CAPTURE_COUNT - 1)) +
        LOGO_HEIGHT;
        
    const finalCanvas = pageWrapper.querySelector('#final-canvas');
    if (!finalCanvas) return;
    const ctx = finalCanvas.getContext('2d');
    
    finalCanvas.width = CANVAS_WIDTH;
    finalCanvas.height = TOTAL_HEIGHT;

    // 1. 배경 (프레임) 색상 설정
    ctx.fillStyle = color === 'black' ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, TOTAL_HEIGHT);

    let currentY = PADDING;
    let imagesLoaded = 0;
    
    // 2. 이미지들을 순서대로 캔버스에 그리기 (비동기 처리)
    capturedImages.forEach((dataUrl) => {
        const photoImg = new Image();
        photoImg.onload = () => {
            ctx.drawImage(photoImg, PADDING, currentY, PHOTO_WIDTH, PHOTO_HEIGHT);

            currentY += PHOTO_HEIGHT + GAP;
            imagesLoaded++;

            // 3. 마지막 이미지 로드 후 로고 추가
            if (imagesLoaded === CAPTURE_COUNT) {
                ctx.fillStyle = color === 'black' ? '#ffffff' : '#1a1a1a';
                ctx.font = '30px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('WEB FOUR CUT', CANVAS_WIDTH / 2, TOTAL_HEIGHT - LOGO_HEIGHT / 3);
            }
        };
        photoImg.src = dataUrl;
    });
}

/**
 * @public
 * 캔버스에 그려진 최종 이미지를 파일로 변환하여 사용자에게 다운로드하도록 요청합니다.
 * @param {HTMLElement} pageWrapper - 최종 캔버스를 포함하는 DOM 요소.
 */
export function downloadImage(pageWrapper) {
    const finalCanvas = pageWrapper.querySelector('#final-canvas');
    if (!finalCanvas) {
        AppService.showAppMessage('다운로드 오류', '완성된 이미지를 찾을 수 없습니다.', true);
        return;
    }

    finalCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('aria-label', '웹 네컷 이미지 파일 다운로드'); 
        a.href = url;
        a.download = `web_fourcut_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // 메모리 관리를 위해 URL 해제
        URL.revokeObjectURL(url);
    }, 'image/png');
}