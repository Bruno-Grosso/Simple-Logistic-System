"use server"

import { redirect } from "next/navigation"

import { api, AxiosError } from "@/lib/api"

export type RegisterFormState = {
  error?: string
}

function generateUserId(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  return (
    "USR-" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  )
}

export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const address = String(formData.get("address") ?? "").trim()

  if (!name || !email || !password || !address) {
    return { error: "All fields are required." }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." }
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  try {
    await api.auth.register({ id: generateUserId(), name, email, password, address, role: "client" })
  } catch (err) {
    if (err instanceof AxiosError && err.response) {
      const data = err.response.data as Record<string, unknown>
      const msg =
        typeof data.error === "string" ? data.error : "Registration failed. Please try again."
      return { error: msg }
    }
    return { error: "Could not reach the server. Please try again later." }
  }

  redirect("/login?registered=1")
}
