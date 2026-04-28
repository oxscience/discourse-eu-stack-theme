import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  // Category gradient icons were attempted twice (originally before
  // 2026-04-11, and again on 2026-04-28) and both times produced visible
  // glitches: setTimeout-based swaps caused a hollow→filled flash, and
  // the MutationObserver-based version broke icons on browser back-
  // navigation and mobile. The plain Lucide outline is the stable look.
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
