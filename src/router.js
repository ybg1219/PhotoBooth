export const router = {
  routes: {},

  // 라우트 등록
  register(path, component) {
    this.routes[path] = component;
  },

  // 이동
  navigate(path) {
    history.pushState({}, "", path);
    this.loadRoute(path);
  },

  // 현재 경로 로드
  loadRoute(path) {
    const route = this.routes[path];
    const app = document.querySelector("#app");

    // 1. ⚠️ 이전 컴포넌트 정리(Cleanup) ⚠️
    // app 요소에 자식 노드가 있고, 그 자식 노드에 cleanup 함수가 있다면 호출합니다.
    const previousChild = app.firstChild;
    if (previousChild && typeof previousChild.cleanup === 'function') {
        previousChild.cleanup();
        console.log('✅ 이전 페이지 cleanup 함수 호출 완료.');
    }

    // 2. 새 경로 로드
    if (route) {
      app.innerHTML = "";
      // route() 실행 결과(DOM 요소)를 app에 추가합니다.
      app.appendChild(route()); 
    } else {
      app.innerHTML = "<h2>404 Not Found</h2>";
    }
  },
};
