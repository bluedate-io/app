// ─── Inngest client ───────────────────────────────────────────────────────────
import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "tryren",
  // In production Inngest reads INNGEST_EVENT_KEY from the environment.
  // In local dev, start the Inngest dev server:  npx inngest-cli@latest dev
});
