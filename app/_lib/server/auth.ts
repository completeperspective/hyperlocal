import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, sessionOptions } from "./session";

export const auth = {
  isAuthenticated,
  getSession,
};

async function isAuthenticated() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (session?.data) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function getSession() {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    if (session?.data) {
      return session;
    }
    return { data: null };
  } catch {
    return { data: null };
  }
}
