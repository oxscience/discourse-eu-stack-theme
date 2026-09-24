import { apiInitializer } from "discourse/lib/api";

export default apiInitializer("0.8", (api) => {
  // The reader redirect in common/head_tag.html only sees full page loads. Discourse moves between
  // pages without reloading, so a user who is on an allowed page (confirm-email step, /login while
  // already logged in, legal pages) could click on into the forum. Same check on every page change.
  // Staff keep navigating the backend freely.
  api.onPageChange((url) => {
    const user = api.getCurrentUser();
    if (user && !user.staff) {
      window.oxReaderRedirect?.(new URL(url, window.location.origin).pathname, user);
    }
  });
});
