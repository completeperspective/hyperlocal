import "dotenv/config";
import { createAuth } from "@keystone-6/auth";
import { statelessSessions } from "@keystone-6/core/session";

const AUTH_SESSION_NAME = process.env.AUTH_SESSION_NAME as string;
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET as string;
const AUTH_SESSION_EXPIRY = process.env.AUTH_SESSION_EXPIRY as string;

const { withAuth } = createAuth({
  listKey: "User",
  identityField: "email",
  secretField: "password",
  sessionData: "id name isAdmin",
  initFirstItem: {
    fields: ["name", "email", "password"],
    itemData: { isAdmin: true },
    skipKeystoneWelcome: true,
  },
});

const cookieName = AUTH_SESSION_NAME + "-admin";

const session = statelessSessions({
  cookieName,
  maxAge: parseInt(AUTH_SESSION_EXPIRY, 10) || 60 * 60 * 24 * 360,
  secret: AUTH_SESSION_SECRET || "ohshowmethewaytothenextwhiskeybar",
});

export { withAuth, session };
