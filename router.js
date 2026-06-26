export class Router {
  constructor(routes = []) {
    this.routes = routes;
    this.currentPath = window.location.pathname;
    this.currentQuery = new URLSearchParams(window.location.search);
  }

  navigate(path) {
    const [routePath, queryString] = path.split("?");
    const url = new URL(window.location.origin + routePath);

    if (queryString) {
      const params = new URLSearchParams(queryString);
      for (const [key, value] of params.entries()) {
        url.searchParams.set(key, value);
      }
    }

    window.history.pushState({}, "", url.toString());
    this.currentPath = url.pathname;
    this.currentQuery = new URLSearchParams(url.search);
    this.resolve();
  }

  replace(path) {
    const [routePath, queryString] = path.split("?");
    const url = new URL(window.location.origin + routePath);

    if (queryString) {
      const params = new URLSearchParams(queryString);
      for (const [key, value] of params.entries()) {
        url.searchParams.set(key, value);
      }
    }

    window.history.replaceState({}, "", url.toString());
    this.currentPath = url.pathname;
    this.currentQuery = new URLSearchParams(url.search);
    this.resolve();
  }

  back() {
    window.history.back();
  }

  forward() {
    window.history.forward();
  }

  getParams() {
    const params = {};
    for (const [key, value] of this.currentQuery.entries()) {
      params[key] = value;
    }
    return params;
  }

  getParam(key) {
    return this.currentQuery.get(key);
  }

  resolve() {
    const path = this.currentPath;
    const matchedRoute = this.routes.find((route) => route.match(path));

    if (!matchedRoute) {
      console.warn(`[Router] Ruta no encontrada: ${path}. Redirigiendo a /home.`);
      this.replace("/home");
      return;
    }

    if (typeof matchedRoute.handler === "function") {
      matchedRoute.handler(this.getParams());
    }
  }

  init() {
    window.addEventListener("popstate", () => {
      this.currentPath = window.location.pathname;
      this.currentQuery = new URLSearchParams(window.location.search);
      this.resolve();
    });

    this.resolve();
  }

  addRoute(path, handler) {
    const regexPath = path.replace(/:([^/]+)/g, "([^/]+)");
    this.routes.push({
      path,
      regex: new RegExp(`^${regexPath}$`),
      match: (currentPath) => this.routes[this.routes.length - 1].regex.test(currentPath),
      handler,
    });
    return this;
  }

  getCurrentRoute() {
    return this.routes.find((route) => route.match(this.currentPath)) || null;
  }
}

export function linkTo(path) {
  return (e) => {
    e.preventDefault();
    window.router.navigate(path);
  };
}
