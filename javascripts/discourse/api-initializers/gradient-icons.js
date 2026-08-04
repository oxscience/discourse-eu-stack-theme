import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  // Category gradient icons were attempted twice FROM JAVASCRIPT (originally
  // before 2026-04-11, and again on 2026-04-28) and both times produced
  // visible glitches: setTimeout-based swaps caused a hollow→filled flash,
  // and the MutationObserver-based version broke icons on browser back-
  // navigation and mobile. So: no JS icon manipulation in this file.
  //
  // What failed was the JS route, NOT the gradient. Since 2026-06-01 the
  // gradient icons are live and stable via CSS mask-image, see the block
  // "OX Category Icon Treatment v2" in common/common.scss. Every top-level
  // category has a per-id rule there that hides svg.d-icon and paints the
  // icon as a ::before pseudo element. A category without such a rule shows
  // the raw Lucide SVG and therefore looks bigger and heavier than its
  // neighbours. The fix is adding the rule, never a transform on the SVG.
  //
  // This file is kept as the home for the AI-bot header icon override.

  // Override AI bot header icons:
  //   "robot"   → "robot"     (open bot)
  //   "shuffle" → "arrow-left" (back to forum)
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
