export const router = {
  routes: {},

  // 라우트 등록
  register(path, component) {
    this.routes[path] = component;
  },

  // 이동
  navigate(path, component) {
    history.pushState({}, "", path);
    document.querySelector("#app").innerHTML = "";
    document.querySelector("#app").appendChild(component);
  },

  // 현재 경로 로드
  loadRoute(path) {
    const route = this.routes[path];
    if (route) {
      document.querySelector("#app").innerHTML = "";
      document.querySelector("#app").appendChild(route);
    } else {
      document.querySelector("#app").innerHTML = "<h2>404 Not Found</h2>";
    }
  },
};
