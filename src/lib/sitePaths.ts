/**
 * 靜態 HTML 與 React 同站部署時，dist-react 內的路由需回到上一層目錄。
 */
export function staticAsset(href: string): string {
  if (typeof window === "undefined") {
    return href.startsWith("../") ? href : href.replace(/^\.\//, "./");
  }
  const path = window.location.pathname || "";
  if (/\/dist-react\//i.test(path) || /\/dist-react$/i.test(path)) {
    const rest = href.replace(/^\.\//, "");
    return `../${rest}`;
  }
  return href.startsWith("./") ? href : `./${href}`;
}
