import dotenv from "dotenv";
import { config } from "@keystone-6/core";
import { lists } from "./schema";
import { withAuth, session } from "./auth";

dotenv.config();

const DB = process.env.DATABASE_URL;

if (!DB) {
  throw new Error("DATABASE_URL is not set");
}

export default withAuth(
  config({
    db: {
      provider: "postgresql",
      url: DB,
      prismaClientPath: "node_modules/.prisma/client",
      enableLogging: true,
      onConnect: async (context) => {
        console.log("💾 Connected to database");
      },
    },
    lists,
    session,
    ui: {
      isAccessAllowed: (context) => !!context?.session?.data?.isAdmin,
    },
  })
);
