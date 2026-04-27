import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  // Category gradient icons — restored 2026-04-28.
  // The previous version used setTimeout(300ms/1000ms) which caused a visible
  // hollow→filled flash. This version uses a MutationObserver to swap icons
  // as soon as the .category-box enters the DOM, plus a CSS pre-hide with a
  // 200ms fallback so the original Lucide outline never flashes.
  // Stroke gradient (not fill) preserves the Lucide outline aesthetic.

  const gradients = {
    training:             ["#FFA94D", "#F58220"],
    klinik:               ["#E07A7A", "#B54A4A"],
    ernaehrung:           ["#7BC97B", "#4A9B4A"],
    "forschung-evidenz":  ["#6D8CFF", "#2E6A9A"],
    "pain-performance":   ["#5BC9A5", "#358A6A"],
    webinare:             ["#67E8F9", "#0088CC"],
    "pro-teams":          ["#A78BFA", "#7B4EA0"],
    "deep-dives":         ["#6BA9D9", "#2F70AC"],
    "ox-symposien-pro":   ["#B8B8B8", "#6B6560"],
    austausch:            ["#B8B8B8", "#6B6560"],
    "ox-team":            ["#B8B8B8", "#6B6560"],
  };
  const defaultGrad = ["#B8B8B8", "#6B6560"];

  function getColors(href) {
    for (const key in gradients) {
      if (href.indexOf("/" + key) > -1) return gradients[key];
    }
    return defaultGrad;
  }

  function applyGradientIcon(box) {
    if (box.dataset.euGrad) return;

    const link = box.querySelector("a.parent-box-link");
    const svg = box.querySelector(
      ".category-box-heading .badge-category.--style-icon > svg.d-icon"
    );
    if (!link || !svg) return;

    const useEl = svg.querySelector("use");
    if (!useEl) return;

    const symbolRef =
      useEl.getAttribute("href") || useEl.getAttribute("xlink:href");
    if (!symbolRef) return;

    const symbol = document.getElementById(symbolRef.replace("#", ""));
    if (!symbol) return;

    const href = link.getAttribute("href") || "";
    const colors = getColors(href);
    const uid = "eu-g-" + Math.random().toString(36).substring(2, 8);
    const ns = "http://www.w3.org/2000/svg";

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

    const g = document.createElementNS(ns, "g");
    g.setAttribute("stroke", "url(#" + uid + ")");
    g.setAttribute("fill", "none");
    // Inherit Lucide stroke styling from the source symbol
    ["stroke-width", "stroke-linecap", "stroke-linejoin"].forEach((attr) => {
      const val = symbol.getAttribute(attr);
      if (val) g.setAttribute(attr, val);
    });
    g.innerHTML = symbol.innerHTML;

    // Replace the existing SVG's content in place — Discourse keeps the
    // wrapper, we just swap the inner sprite reference for our gradient group.
    svg.innerHTML = "";
    svg.appendChild(defs);
    svg.appendChild(g);

    svg.classList.add("eu-gradient-icon");
    box.dataset.euGrad = "1";
  }

  function processAll(root) {
    (root || document)
      .querySelectorAll(".category-box")
      .forEach(applyGradientIcon);
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.classList && node.classList.contains("category-box")) {
          applyGradientIcon(node);
        } else if (node.querySelectorAll) {
          processAll(node);
        }
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // On route change (or bfcache restore) Ember can recycle a .category-box
  // while replacing its inner <svg> with a fresh sprite reference. The stale
  // data-eu-grad marker would otherwise make us skip it, leaving raw Lucide
  // outlines visible. Detect that case (svg has a <use> again → was re-
  // rendered) and reset the marker so applyGradientIcon reprocesses.
  function refreshStaleBoxes() {
    document.querySelectorAll(".category-box").forEach((box) => {
      const svg = box.querySelector(
        ".category-box-heading .badge-category.--style-icon > svg.d-icon"
      );
      if (svg && svg.querySelector("use")) {
        delete box.dataset.euGrad;
      }
      applyGradientIcon(box);
    });
  }

  api.onPageChange(refreshStaleBoxes);

  // bfcache restore: JS doesn't re-init, so trigger refresh manually.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) refreshStaleBoxes();
  });

  // Override AI bot header icons (kept from previous version)
  api.modifyClass("component:ai-bot-header-icon", {
    pluginId: "eu-stack-ai-icons",
    get icon() {
      if (this.clickShouldRouteOutOfConversations) {
        return "arrow-left";
      }
      return "robot";
    },
  });
});
