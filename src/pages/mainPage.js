// mainpage.js
import { router } from "../router.js";

/**
 * 메인 페이지 컴포넌트 (유동 시뮬레이션 대체)
 * @param {HTMLElement} container - 페이지가 렌더링될 DOM 요소 (#app)
 * @returns {Function} 페이지가 사라질 때 호출될 정리(cleanup) 함수
 */
export function MainPage(container) {
    container.innerHTML = `
        <div class="p-8 text-center max-w-xl mx-auto">
            <h1 class="text-4xl font-extrabold mb-4 text-gray-800">메인 (유동 시뮬레이션)</h1>
            <p class="text-lg text-gray-500 mb-6">현재 유동 시뮬레이션 코드가 준비 중입니다.</p>
            <p class="text-lg text-gray-700">웹캠 기능을 보시려면 아래 버튼을 클릭해 주세요.</p>
            
            <button id="goToPhotoBtn" class="mt-8 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full shadow-lg transition duration-200">
                📸 웹 네컷으로 이동
            </button>
        </div>
    `;

    // 이벤트 리스너 추가
    const goToPhotoBtn = container.querySelector("#goToPhotoBtn");
    const handleClick = () => {
        router.navigate('/photo');
    };
    goToPhotoBtn.addEventListener('click', handleClick);

    // 정리(cleanup) 함수 반환
    return () => {
        // 이벤트 리스너 제거
        goToPhotoBtn.removeEventListener('click', handleClick);
        // 컨테이너 비우기 (router에서 이미 비우지만, 컴포넌트 내에서 정리하는 것이 명확)
        container.innerHTML = '';
        console.log('MainPage cleanup 완료.');
    };
}