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
    const link = box.querySelector("a.parent-box-link");
    const svg = box.querySelector(
      ".category-box-heading .badge-category.--style-icon > svg.d-icon"
    );
    if (!link || !svg) return;

    // Sprite ref: prefer a fresh <use> reference, otherwise fall back to a
    // ref we cached on a previous apply. This lets us re-render even after
    // the <use> has been replaced by our own group.
    const useEl = svg.querySelector("use");
    const freshRef = useEl
      ? useEl.getAttribute("href") || useEl.getAttribute("xlink:href")
      : null;
    const symbolRef = freshRef || box.dataset.euSymbolRef;
    if (!symbolRef) return;

    box.dataset.euSymbolRef = symbolRef;

    // Idempotent: skip only when the marker is set AND our gradient is
    // physically present in the SVG. The marker alone is no longer trusted —
    // back-navigation and bfcache restores can leave it stale.
    if (
      box.dataset.euGrad &&
      svg.querySelector("defs > linearGradient[id^='eu-g-']")
    ) {
      return;
    }

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
    g.setAttribute("fill", "none");
    // Lucide defaults if the source symbol doesn't carry them.
    g.setAttribute("stroke-width", symbol.getAttribute("stroke-width") || "2");
    g.setAttribute("stroke-linecap", symbol.getAttribute("stroke-linecap") || "round");
    g.setAttribute("stroke-linejoin", symbol.getAttribute("stroke-linejoin") || "round");
    g.innerHTML = symbol.innerHTML;

    // Force gradient stroke directly on every drawable child. Lucide paths
    // commonly carry stroke="currentColor", which would otherwise override
    // any stroke set on the parent <g>.
    g.querySelectorAll(
      "path, line, circle, rect, polygon, polyline, ellipse"
    ).forEach((el) => {
      el.setAttribute("stroke", "url(#" + uid + ")");
      const fill = el.getAttribute("fill");
      if (!fill || fill === "currentColor") {
        el.setAttribute("fill", "none");
      }
    });

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

  // On route change / browser back-forward / bfcache restore, even when the
  // DOM looks correct, the browser may render an older paint of the SVG
  // (raw Lucide outlines that were visible before our first apply). Force a
  // full re-apply on every refresh — applyGradientIcon rewrites the SVG
  // contents, which triggers a fresh paint and erases any stale rendering.
  // Cheap because there are only a handful of category boxes.
  function refreshStaleBoxes() {
    document.querySelectorAll(".category-box").forEach((box) => {
      delete box.dataset.euGrad;
      applyGradientIcon(box);
    });
  }

  // Run once now AND on the next frame — Ember may not have finished
  // re-rendering by the time the routing hook fires.
  function refreshNowAndNextFrame() {
    refreshStaleBoxes();
    requestAnimationFrame(refreshStaleBoxes);
  }

  api.onPageChange(refreshNowAndNextFrame);

  // Native browser back/forward — fires reliably even when Discourse's
  // own page-change hook misses a transition.
  window.addEventListener("popstate", refreshNowAndNextFrame);

  // bfcache restore: JS doesn't re-init, trigger refresh manually.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) refreshNowAndNextFrame();
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
