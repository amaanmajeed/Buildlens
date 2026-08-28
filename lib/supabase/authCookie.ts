import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  type SessionBlob,
} from "@/lib/supabase/sessionCookie";

/** Persist session tokens in an httpOnly cookie after login/signup. */
export function setAuthCookie(
  response: NextResponse,
  session: { access_token: string; refresh_token: string }
) {
  const blob: SessionBlob = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  };
  response.cookies.set(COOKIE_NAME, JSON.stringify(blob), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
