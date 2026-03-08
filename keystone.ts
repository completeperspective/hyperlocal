import "dotenv/config";
import { config } from "@keystone-6/core";

import { lists } from "./schema";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://localhost:5432/web-app-dev";

export default config({
  lists,
  db: {
    provider: "postgresql",
    url: DATABASE_URL,
    onConnect: async (context) => {
      console.log("💾 Connected to database");
    },
    // Optional advanced configuration
    enableLogging: true,
  },
  ui: {
    isDisabled: false,
    isAccessAllowed: (context) => true,
  },
});
