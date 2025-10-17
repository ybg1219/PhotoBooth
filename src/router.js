// router.js

/**
 * @private
 * @type {Function|null}
 * 현재 활성화된 컴포넌트가 반환한 정리(Cleanup) 함수. 
 * 라우트 변경 시 호출되어 웹캠 스트림 등의 자원을 해제합니다.
 */
let currentCleanup = null; 

/**
 * @public
 * @namespace
 * 해시(Hash) 기반 SPA 라우팅을 관리하는 핵심 객체.
 * 컴포넌트를 등록하고, URL 변화에 따라 적절한 컴포넌트를 렌더링합니다.
 */
export const router = {
    /**
     * @private
     * @type {Object<string, Function>}
     * 경로(path)와 해당 경로에 매핑된 컴포넌트(함수)를 저장하는 맵.
     */
    routes: {},
    
    /**
     * @private
     * @type {HTMLElement|null}
     * 컴포넌트가 렌더링될 메인 컨테이너 DOM 요소 (#app).
     */
    appContainer: null, 
    
    /**
     * 새로운 경로에 컴포넌트 함수를 등록합니다.
     * @param {string} path - 등록할 URL 경로 (예: '/main', '/photo').
     * @param {Function} component - 경로에 매핑될 컴포넌트 함수.
     */
    register(path, component) {
        this.routes[path] = component;
    },

    /**
     * 라우터를 초기화하고, 이벤트 리스너를 설정합니다.
     * @param {HTMLElement} appElement - 컴포넌트가 렌더링될 DOM 요소 (#app).
     */
    init(appElement) {
        this.appContainer = appElement;
        
        // URL 해시 변경 이벤트에 핸들러를 바인딩하여 연결
        window.addEventListener('hashchange', this.handleLocationChange.bind(this));
        
        // 초기 로드 시 경로가 설정되지 않았으면 기본 경로로 이동
        if (window.location.hash === '' || window.location.hash === '#/') {
            window.location.hash = '#/main'; // 기본 경로 설정
        }
        // 초기 페이지를 수동으로 로드
        this.handleLocationChange();
    },

    /**
     * 브라우저의 URL 해시를 변경하여 경로를 이동시킵니다.
     * @param {string} path - 이동할 경로 (예: 'photo' 또는 '#/photo').
     */
    navigate(path) {
        // #/ 형식을 보장하며 URL 해시를 업데이트합니다.
        window.location.hash = path.startsWith('#/') ? path : `#${path}`;
        // hashchange 이벤트가 자동으로 handleLocationChange를 호출합니다.
    },

    /**
     * URL 해시 변경 이벤트 발생 시 호출되며, 페이지를 로드하고 이전 자원을 정리합니다.
     */
    handleLocationChange() {
        // 1. 이전 페이지 자원 정리 (Cleanup)
        if (currentCleanup) {
            currentCleanup();
            currentCleanup = null;
        }

        this.appContainer.innerHTML = ''; // 기존 컨텐츠 제거
        
        // #/ 경로에서 경로 이름만 추출 (예: '#/main' -> '/main') || default to '/main'
        const path = window.location.hash.substring(1) || '/main';
        
        const component = this.routes[path];

        if (component) {
            // 2. 새 컴포넌트 렌더링
            // 컴포넌트를 실행하고, #app 컨테이너를 인수로 전달
            // 컴포넌트가 반환하는 cleanup 함수를 저장
            currentCleanup = component(this.appContainer); 
        } else {
            // 3. 404 Not Found 페이지 렌더링
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