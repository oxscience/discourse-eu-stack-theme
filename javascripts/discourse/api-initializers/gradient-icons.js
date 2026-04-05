import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  const gradients = {
    health: ["#34d399", "#2E8B47"],
    forschung: ["#6d8cff", "#2E6A9A"],
    tech: ["#67e8f9", "#3A7AAA"],
    "pro-teams": ["#a78bfa", "#7B4EA0"],
  };
  const defaultGrad = ["#b8b8b8", "#6b6560"];

  function getColors(href) {
    for (const key in gradients) {
      if (href.indexOf(key) > -1) return gradients[key];
    }
    return defaultGrad;
  }

  function applyGradientIcons() {
    document.querySelectorAll(".category-box").forEach((box) => {
      if (box.dataset.euGrad) return;

      const link = box.querySelector("a.parent-box-link");
      // Only target the main category icon (style-icon), not lock/doc icons
      const svg = box.querySelector(".category-box-heading .badge-category.--style-icon > svg.d-icon");
      if (!link || !svg) return;

      const useEl = svg.querySelector("use");
      if (!useEl) return;

      const symbolRef =
        useEl.getAttribute("href") || useEl.getAttribute("xlink:href");
      if (!symbolRef) return;

      const symbolId = symbolRef.replace("#", "");
      const symbol = document.getElementById(symbolId);
      if (!symbol) return;

      const href = link.getAttribute("href") || "";
      const colors = getColors(href);
      const uid = "eu-g-" + Math.random().toString(36).substr(2, 6);

      // Build new SVG with inline gradient
      const vb = symbol.getAttribute("viewBox") || "0 0 512 512";
      const ns = "http://www.w3.org/2000/svg";

      const newSvg = document.createElementNS(ns, "svg");
      newSvg.setAttribute("viewBox", vb);
      newSvg.setAttribute("aria-hidden", "true");
      newSvg.setAttribute(
        "class",
        svg.getAttribute("class") + " eu-gradient-icon"
      );

      // Gradient def
      const defs = document.createElementNS(ns, "defs");
      const grad = document.createElementNS(ns, "linearGradient");
      grad.setAttribute("id", uid);
      grad.setAttribute("x1", "0%");
      grad.setAttribute("y1", "0%");
      grad.setAttribute("x2", "100%");
      grad.setAttribute("y2", "100%");

      const stop1 = document.createElementNS(ns, "stop");
      stop1.setAttribute("offset", "0%");
      stop1.setAttribute("stop-color", colors[0]);
      const stop2 = document.createElementNS(ns, "stop");
      stop2.setAttribute("offset", "100%");
      stop2.setAttribute("stop-color", colors[1]);

      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
      newSvg.appendChild(defs);

      // Clone symbol content with gradient fill
      const g = document.createElementNS(ns, "g");
      g.setAttribute("fill", "url(#" + uid + ")");
      g.innerHTML = symbol.innerHTML;
      newSvg.appendChild(g);

      // Replace original
      svg.style.display = "none";
      svg.parentNode.insertBefore(newSvg, svg.nextSibling);
      box.dataset.euGrad = "1";
    });
  }

  api.onPageChange(() => {
    setTimeout(applyGradientIcons, 300);
    setTimeout(applyGradientIcons, 1000);
  });

  // Override AI bot header icons:
  // "robot" → "wand-magic-sparkles" (open bot)
  // "shuffle" → "arrow-left" (back to forum)
  api.modifyClass("component:ai-bot-header-icon", {
    pluginId: "eu-stack-ai-icons",
    get icon() {
      if (this.clickShouldRouteOutOfConversations) {
        return "arrow-left";
      }
      return "microchip";
    },
  });
});
