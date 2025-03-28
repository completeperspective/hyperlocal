/* eslint-disable @typescript-eslint/no-unused-vars */
import { randomBytes } from "node:crypto";
import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import type { SessionStrategy } from "@keystone-6/core/types";
import { keystoneContext } from "./keystone";

const AUTH_SESSION_NAME = process.env.AUTH_SESSION_NAME as string;
const AUTH_SESSION_SECRET = process.env.AUTH_SESSION_SECRET as string;
const AUTH_SESSION_EXPIRY = process.env.AUTH_SESSION_EXPIRY as string;

export interface SessionData {
  listKey: string;
  itemId: string;
  data?: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
  };
}

export const defaultSession: SessionData = {
  listKey: "",
  itemId: "",
};

export const sessionOptions: SessionOptions = {
  password: AUTH_SESSION_SECRET,
  cookieName: AUTH_SESSION_NAME,
  cookieOptions: {
    maxAge: parseInt(AUTH_SESSION_EXPIRY, 10),
    // secure only works in `https` environments
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export function ironSessions<Session extends SessionData>({
  secret = randomBytes(32).toString("base64url"),
  maxAge = 60 * 60 * 8, // 8 hours,
  cookieName = process.env.AUTH_SESSION_NAME,
  path = "/",
  secure = process.env.NODE_ENV === "production",
  domain,
  sameSite,
}: {
  secret?: string;
  maxAge?: number;
  cookieName?: string;
  path?: string;
  secure?: boolean;
  domain?: string;
  sameSite?: true | false | "lax" | "strict" | "none";
} = {}): SessionStrategy<Session, any> {
  // atleast 192-bit in base64
  if (secret.length < 32) {
    throw new Error("The session secret must be at least 32 characters long");
  }

  return {
    async get({ context }) {
      const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

      return session as unknown as Session;
    },
    async end({ context }) {
      const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

      await session.destroy();
    },
    async start({ context, data }) {
      const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

      console.log("---------", { session });
      try {
        const user = await keystoneContext.sudo().query.User.findOne({
          where: { id: data?.itemId },
          query: "id name email isAdmin",
        });

        console.log({ user });
        session.data = {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          isAdmin: user?.isAdmin,
        };

        await session.save();
      } catch (err) {
        console.log(err);
        return null;
      }
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get(AUTH_SESSION_NAME)?.value;
      return sessionToken;
    },
  };
}
