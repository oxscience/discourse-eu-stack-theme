import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  // "> **Stand heute.** …" boxes (Sapolsky series) get the class the Campus Reader gives them
  // (campus-reader routes/reader.py, _NOW_BOX). CSS cannot match the bold opening words.
  // Colour: block "now-box" in common/common.scss.
  api.decorateCookedElement((elem) => {
    elem.querySelectorAll("blockquote").forEach((quote) => {
      const first = quote.querySelector(":scope > p:first-child")?.firstChild;
      if (first?.nodeName === "STRONG" && first.textContent === "Stand heute.") {
        quote.classList.add("now-box");
      }
    });
  });
});
