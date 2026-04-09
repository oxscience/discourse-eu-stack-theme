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
      return "robot";
    },
  });

  // =============================================
  // FLOATING AI ASSISTANT BUTTON
  // =============================================
  // Renders a fixed bottom-right button that triggers
  // the existing AI bot header icon (same action, better placement).

  function createFab() {
    if (document.querySelector(".ox-ai-fab")) return;

    const fab = document.createElement("button");
    fab.className = "ox-ai-fab";
    fab.setAttribute("aria-label", "OX Assistent");
    fab.innerHTML =
      '<svg class="d-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="24" height="24">' +
      '<path fill="currentColor" d="M234.7 42.7L197 56.8c-3 1.1-5 4-5 7.2s2 6.1 5 7.2l37.7 14.1L248.8 123c1.1 3 4 5 7.2 5s6.1-2 7.2-5l14.1-37.7L315 71.2c3-1.1 5-4 5-7.2s-2-6.1-5-7.2L277.3 42.7 263.2 5c-1.1-3-4-5-7.2-5s-6.1 2-7.2 5L234.7 42.7zM461.4 48L496 82.6 386.6 192 352 157.4 461.4 48zM46.1 254.1L3.5 296.8c-4.7 4.7-4.7 12.3 0 17l236.7 236.7c4.7 4.7 12.3 4.7 17 0l42.7-42.7c4.7-4.7 4.7-12.3 0-17L62.1 254.1c-4.7-4.7-12.3-4.7-17 0zM107.4 254.1c-4.7-4.7-12.3-4.7-17 0L47.7 296.8c-4.7 4.7-4.7 12.3 0 17l127.3 127.3L317.8 298.3l-83-83L107.4 254.1zM328 164l26.8 65.2L420 256l-65.2 26.8L328 348l-26.8-65.2L236 256l65.2-26.8L328 164zM530.6 67.6L508.4 45.4c-12.5-12.5-32.8-12.5-45.3 0L332.4 176.1l45.3 45.3L508.4 90.6c6.2-6.2 9.8-14.4 10.5-22.9L530.6 67.6z"/>' +
      "</svg>" +
      '<span class="ox-ai-fab__tooltip">OX Assistent</span>';

    fab.addEventListener("click", function () {
      // Try to click the existing AI bot header button
      const headerBtn = document.querySelector(
        ".ai-bot-button, [data-name='ai-bot-header-icon'] button, .btn-ai-bot-header"
      );
      if (headerBtn) {
        headerBtn.click();
        return;
      }

      // Fallback: navigate to new PM with the bot
      // The bot username is configurable — "OX_Assistent" is a common choice.
      // Discourse AI uses a system user, so we try the standard bot path first.
      const botBtn = document.querySelector(
        ".d-header .ai-bot-button, .d-header [class*='ai-bot']"
      );
      if (botBtn) {
        botBtn.click();
      } else {
        // Ultimate fallback: route to AI bot conversations
        window.location.href = "/my/activity/ai-conversations";
      }
    });

    document.body.appendChild(fab);
  }

  function removeFab() {
    const fab = document.querySelector(".ox-ai-fab");
    if (fab) fab.remove();
  }

  // Only show for logged-in users, not on landing page
  api.onPageChange(() => {
    if (api.getCurrentUser()) {
      setTimeout(createFab, 500);
    } else {
      removeFab();
    }
  });
});
