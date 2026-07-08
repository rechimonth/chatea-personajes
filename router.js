export class Router {
  constructor(routes = []) {
    this.routes = [];
    this.currentPath = window.location.pathname;
    this.currentQuery = new URLSearchParams(window.location.search);

    routes.forEach(({ path, handler }) => this.addRoute(path, handler));
  }

  normalizePath(path) {
    const sanitized = path || "/";
    return sanitized.length > 1 ? sanitized.replace(/\/$/, "") : sanitized;
  }

  navigate(path) {
    const [routePath, queryString] = path.split("?");
    const url = new URL(window.location.origin + this.normalizePath(routePath || "/"));

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
    return this;
  }

  replace(path) {
    const [routePath, queryString] = path.split("?");
    const url = new URL(window.location.origin + this.normalizePath(routePath || "/"));

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
    return this;
  }

  back() {
    window.history.back();
    return this;
  }

  forward() {
    window.history.forward();
    return this;
  }

  getParams() {
    const params = {};
    for (const [key, value] of this.currentQuery.entries()) {
      params[key] = value;
    }

    const currentRoute = this.getCurrentRoute();
    if (!currentRoute) return params;

    const values = currentRoute.regex.exec(this.normalizePath(this.currentPath));
    if (!values) return params;

    const keys = currentRoute.path.match(/:([^/]+)/g) || [];
    keys.forEach((key, index) => {
      params[key.replace(":", "")] = values[index + 1];
    });

    return params;
  }

  getParam(key) {
    return this.currentQuery.get(key);
  }

  resolve() {
    const path = this.normalizePath(this.currentPath);
    const matchedRoute = this.routes.find((route) => route.regex.test(path));

    if (!matchedRoute) {
      console.warn(`[Router] Ruta no encontrada: ${path}. Redirigiendo a /.`);
      this.replace("/");
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
    return this;
  }

  addRoute(path, handler) {
    const regexPath = path.replace(/:([^/]+)/g, "([^/]+)");
    this.routes.push({
      path,
      regex: new RegExp(`^${regexPath}$`),
      handler,
    });
    return this;
  }

  getCurrentRoute() {
    return this.routes.find((route) => route.regex.test(this.normalizePath(this.currentPath))) || null;
  }
}

export function linkTo(path) {
  return (e) => {
    e.preventDefault();
    window.router.navigate(path);
  };
}
