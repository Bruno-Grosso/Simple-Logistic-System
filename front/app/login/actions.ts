"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { SESSION_COOKIE_NAME, sessionCookieMaxAge } from "@/lib/auth/session"
import { authenticateLogin } from "@/lib/auth/verify-credentials"

export type LoginFormState = {
  error?: string
}

export async function loginAction(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Please enter your email and password." }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const auth = await authenticateLogin(email, password)
  if (!auth.ok) {
    if (auth.reason === "backend_no_token") {
      return {
        error:
          "The login API succeeded but returned no session token. Include token/sessionToken/access_token in the JSON body, or set LOGISYS_BACKEND_TOKEN_FIELD.",
      }
    }
    return { error: "Invalid email or password." }
  }

  const store = await cookies()
  store.set(SESSION_COOKIE_NAME, auth.sessionCookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionCookieMaxAge(),
  })

  redirect("/dashboard")
}

export async function logoutAction(): Promise<void> {
  const store = await cookies()
  // Match login cookie options so the browser actually drops the session
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
  redirect("/login")
}
