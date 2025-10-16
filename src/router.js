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

    if (route) {
      app.innerHTML = "";
      app.appendChild(route()); // ✅ 함수 실행은 여기서!
    } else {
      app.innerHTML = "<h2>404 Not Found</h2>";
    }
  },
};
