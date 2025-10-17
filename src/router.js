// router.js (HTML 내의 AppRouter 로직을 모방하여 cleanup을 관리)

// 전역 상태 변수 (AppRouter에서 사용)
let currentCleanup = null; // 현재 페이지의 정리 함수를 저장

export const router = {
    // router 객체 대신, 컴포넌트 맵과 네비게이션 함수를 정의합니다.
    routes: {},
    appContainer: null, // #app DOM 요소를 저장할 변수
    
    // 컴포넌트 등록
    register(path, component) {
        this.routes[path] = component;
    },

    // 초기화 및 이벤트 리스너 설정
    init(appElement) {
        this.appContainer = appElement;
        
        // window.location.hash 변경 감지
        window.addEventListener('hashchange', this.handleLocationChange.bind(this));
        
        // 페이지 로드 시 초기 경로 설정 및 로드
        if (window.location.hash === '' || window.location.hash === '#/') {
            window.location.hash = '#/main'; // 기본 경로 설정
        }
        this.handleLocationChange();
    },

    // 경로 이동 (HTML의 window.location.hash = path 역할)
    navigate(path) {
        // 경로에 #/가 포함되어 있는지 확인하여 설정
        window.location.hash = path.startsWith('#/') ? path : `#${path}`;
    },

    // 경로 변경 처리 및 페이지 로드
    handleLocationChange() {
        // 이전 페이지의 정리 함수 실행 (웹캠 스트림 중지 등)
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }

        this.appContainer.innerHTML = '';
        // #/main 에서 '/main'만 추출
        const path = window.location.hash.substring(1) || '/main';
        
        const component = this.routes[path];

        if (component) {
            // 컴포넌트 함수를 호출하고, #app 컨테이너를 인수로 전달합니다.
            // 컴포넌트가 반환하는 cleanup 함수를 저장합니다.
            currentCleanup = component(this.appContainer); 
        } else {
            this.appContainer.innerHTML = `
                <div class="p-8 text-center max-w-xl mx-auto">
                    <h1 class="text-4xl font-extrabold mb-4 text-red-600">404 Not Found</h1>
                    <p class="text-lg text-gray-500">경로를 찾을 수 없습니다: ${path}</p>
                </div>
            `;
            currentCleanup = null;
        }
    }
};