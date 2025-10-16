/**
 * 포토부스 페이지 (PhotoBoothPage)
 * 웹캠 미리보기 + 촬영 + 저장 기능 포함
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소
 * @returns {Function} cleanup - 페이지가 사라질 때 호출될 정리 함수
 */

export function PhotoBoothPage(container) {
  container.innerHTML = `
    <style>
      .photo-booth {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 20px;
        padding: 20px;
        color: white;
      }

      video {
        width: 320px;
        height: 240px;
        border-radius: 12px;
        background: #000;
        object-fit: cover;
        border: 2px solid #ccc;
      }

      canvas {
        display: none;
      }

      .photo-buttons {
        display: flex;
        gap: 10px;
      }

      button {
        background: #ff66b2;
        border: none;
        border-radius: 8px;
        padding: 10px 16px;
        color: white;
        cursor: pointer;
        font-size: 14px;
        transition: 0.2s;
      }

      button:hover {
        background: #ff3385;
      }

      img.captured {
        margin-top: 15px;
        width: 320px;
        border-radius: 12px;
        border: 2px solid #fff;
      }
    </style>

    <div class="photo-booth">
      <h1>📸 인생네컷 포토부스</h1>
      <video id="camera" autoplay playsinline></video>
      <canvas id="captureCanvas" width="320" height="240"></canvas>

      <div class="photo-buttons">
        <button id="captureBtn">촬영</button>
        <button id="saveBtn">저장</button>
        <button id="retakeBtn" style="display:none;">다시 찍기</button>
      </div>

      <img id="capturedImage" class="captured" style="display:none;" />
    </div>
  `;

  // --- DOM 요소 가져오기 ---
  const video = container.querySelector('#camera');
  const canvas = container.querySelector('#captureCanvas');
  const captureBtn = container.querySelector('#captureBtn');
  const saveBtn = container.querySelector('#saveBtn');
  const retakeBtn = container.querySelector('#retakeBtn');
  const capturedImage = container.querySelector('#capturedImage');
  const ctx = canvas.getContext('2d');

  let stream = null;
  let currentBlob = null;

  // --- 1️⃣ 웹캠 시작 ---
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
    } catch (err) {
      alert('카메라 접근 권한이 필요합니다!');
      console.error(err);
    }
  }

  // --- 2️⃣ 사진 촬영 ---
  function capturePhoto() {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/png');
    capturedImage.src = dataURL;
    capturedImage.style.display = 'block';
    video.style.display = 'none';
    captureBtn.style.display = 'none';
    retakeBtn.style.display = 'inline-block';
    saveBtn.style.display = 'inline-block';
  }

  // --- 3️⃣ 다시 찍기 ---
  function retakePhoto() {
    capturedImage.style.display = 'none';
    video.style.display = 'block';
    captureBtn.style.display = 'inline-block';
    retakeBtn.style.display = 'none';
    saveBtn.style.display = 'none';
  }

  // --- 4️⃣ 이미지 저장 ---
  function savePhoto() {
    const link = document.createElement('a');
    link.download = 'my_photo.png';
    link.href = capturedImage.src;
    link.click();
  }

  // --- 이벤트 등록 ---
  captureBtn.addEventListener('click', capturePhoto);
  saveBtn.addEventListener('click', savePhoto);
  retakeBtn.addEventListener('click', retakePhoto);

  // 페이지 진입 시 카메라 시작
  startCamera();

  // --- cleanup 함수 ---
  return () => {
    // 카메라 종료
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    container.innerHTML = '';
  };
}
