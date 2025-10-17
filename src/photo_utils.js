// photo_utils.js

// AppRouter 유틸리티 및 전역 상태 import
// CAPTURE_COUNT는 이제 함수 내부에서 사용되므로, 상단에서 즉시 계산하지 않습니다.
import { AppRouter, CAPTURE_COUNT, capturedImages, videoStream } from './main.js';

/**
 * 지정된 초만큼 카운트다운을 실행합니다.
 * (이 함수는 CAPTURE_COUNT를 사용하지 않습니다.)
 */
export async function countdown(seconds, pageWrapper) {
    // ... (기존 코드 유지) ...
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
                setTimeout(() => {
                    overlay.classList.remove('show');
                    resolve();
                }, 500); 
            }
        }, 1000);
    }).finally(() => {
        if (timer) clearInterval(timer);
    });
}

/**
 * 웹캠의 현재 프레임을 캡처하고 썸네일을 업데이트합니다.
 * (이 함수는 CAPTURE_COUNT를 사용하지 않습니다.)
 */
export function capturePhoto(video, shotIndex, pageWrapper) {
    // ... (기존 코드 유지) ...
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 거울 모드 구현
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');
    // 전역 capturedImages 배열에 추가
    capturedImages.push(imageData); 
    
    const thumb = pageWrapper.querySelector(`#thumb-${shotIndex}`);
    if (thumb) {
        thumb.style.backgroundImage = `url(${imageData})`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.opacity = '1';
        document.getElementById('app').setAttribute('aria-label', `사진 ${shotIndex + 1} 캡처 완료`);
    }
}

/**
 * 4장 연속 촬영 시퀀스 실행
 */
export function startShotSequence(video, renderResultScreen, pageWrapper) {
    // CAPTURE_COUNT는 여기서 사용되므로 문제 없습니다.
    const totalShots = CAPTURE_COUNT; 
    let isCancelled = false;
    let currentTimeout = null;
    
    const cleanup = () => {
        isCancelled = true;
        if (currentTimeout) clearTimeout(currentTimeout);
    };

    async function sequenceLoop() {
        for (let i = 0; i < totalShots; i++) {
            if (isCancelled) return;
            await countdown(3, pageWrapper); 
            
            if (isCancelled) return;
            capturePhoto(video, i, pageWrapper);
            
            if (i < totalShots - 1) {
                await new Promise(r => currentTimeout = setTimeout(r, 1000)); 
            }
            if (isCancelled) return;
        }
        renderResultScreen();
    }
    
    sequenceLoop();
    return cleanup; 
}

/**
 * 파일 업로드 처리 및 순서 보장
 */
export async function handleFileSelection(event, renderResultScreen) {
    const files = Array.from(event.target.files);
    // CAPTURE_COUNT는 여기서 사용되므로 문제 없습니다.
    if (files.length !== CAPTURE_COUNT) {
        AppRouter.showAppMessage('파일 오류', `정확히 ${CAPTURE_COUNT}장의 사진을 선택해야 합니다.`, true);
        return;
    }

    // ... (기존 코드 유지) ...
    capturedImages.length = 0; 
    
    AppRouter.showLoading('사진 파일을 순서대로 로딩 중입니다...');

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
 * 프레임 색상 업데이트 및 이미지 합성 재실행
 */
export function updateFrameColor(color, pageWrapper) {
    // 캔버스 크기 상수를 함수 내부로 이동하여, 
    // CAPTURE_COUNT가 로드된 후에 사용되도록 합니다.
    const CANVAS_WIDTH = 500;
    const PADDING = 20;
    const GAP = 15;
    const LOGO_HEIGHT = 50;
    const PHOTO_WIDTH = CANVAS_WIDTH - PADDING * 2;
    const PHOTO_HEIGHT = (PHOTO_WIDTH / 4) * 3; 
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

    ctx.fillStyle = color === 'black' ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, CANVAS_WIDTH, TOTAL_HEIGHT);

    let currentY = PADDING;
    let imagesLoaded = 0;
    
    capturedImages.forEach((dataUrl) => {
        const photoImg = new Image();
        photoImg.onload = () => {
            ctx.drawImage(photoImg, PADDING, currentY, PHOTO_WIDTH, PHOTO_HEIGHT);

            currentY += PHOTO_HEIGHT + GAP;
            imagesLoaded++;

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
 * 캔버스 이미지를 다운로드합니다.
 * (이 함수는 CAPTURE_COUNT를 사용하지 않습니다.)
 */
export function downloadImage(pageWrapper) {
    const finalCanvas = pageWrapper.querySelector('#final-canvas');
    if (!finalCanvas) {
        AppRouter.showAppMessage('다운로드 오류', '완성된 이미지를 찾을 수 없습니다.', true);
        return;
    }

    // ... (기존 코드 유지) ...
    finalCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('aria-label', '웹 네컷 이미지 파일 다운로드'); 
        a.href = url;
        a.download = `web_fourcut_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png');
}