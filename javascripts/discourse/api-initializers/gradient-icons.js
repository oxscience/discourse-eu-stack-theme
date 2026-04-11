import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  // Gradient-fill for category icons was removed on 2026-04-11 — Pat prefers
  // the plain Lucide hollow/outline style on category boxes. The old
  // implementation cloned the Lucide SVG and injected a linearGradient fill
  // after 300ms/1000ms setTimeout, which caused a visible hollow→filled flash.
  //
  // This file is kept as the home for the AI-bot header icon override below.
  // If you ever want the gradient look back, see git history for the original.

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
});
