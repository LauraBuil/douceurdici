import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.116.0"

const jsonHeaders = { "Content-Type": "application/json" }
const allowedHosts = new Set(["douceurdici.com", "www.douceurdici.com", "dev.douceurdici.com", "127.0.0.1", "localhost"])

function response(body: Record<string, unknown>, status: number, origin: string) {
  return new Response(JSON.stringify(body), { status, headers: { ...jsonHeaders, "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, content-type, apikey" } })
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get("origin") ?? "https://dev.douceurdici.com"
  let origin = "https://dev.douceurdici.com"
  try {
    const parsed = new URL(requestOrigin)
    if (allowedHosts.has(parsed.hostname)) origin = parsed.origin
  } catch { /* Keep the safe default origin. */ }

  if (request.method === "OPTIONS") return response({ ok: true }, 200, origin)
  if (request.method !== "POST") return response({ error: "Méthode non autorisée." }, 405, origin)

  const authHeader = request.headers.get("Authorization")
  if (!authHeader?.startsWith("Bearer ")) return response({ error: "Authentification requise." }, 401, origin)

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const caller = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } })
  const token = authHeader.slice("Bearer ".length)
  const { data: { user }, error: userError } = await caller.auth.getUser(token)
  if (userError || !user) return response({ error: "Session invalide." }, 401, origin)

  const { data: membership } = await caller.from("admins").select("role,active").eq("user_id", user.id).maybeSingle()
  if (membership?.role !== "admin" || !membership.active) return response({ error: "Seul un administrateur peut ajouter un compte." }, 403, origin)

  let payload: { email?: string; role?: string }
  try { payload = await request.json() } catch { return response({ error: "Informations invalides." }, 400, origin) }
  const email = payload.email?.trim().toLowerCase() ?? ""
  const role = payload.role
  if (!/^\S+@\S+\.\S+$/.test(email) || !["admin", "exploitant"].includes(role ?? "")) return response({ error: "Adresse e-mail ou rôle invalide." }, 400, origin)

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/admin`, data: { invited_by: user.id } })
  if (inviteError || !invitation.user) return response({ error: inviteError?.message.includes("already") ? "Un compte existe déjà avec cette adresse." : "L’invitation n’a pas pu être envoyée." }, 400, origin)

  const { error: profileError } = await admin.from("admins").insert({ user_id: invitation.user.id, email, role, active: true })
  if (profileError) {
    await admin.auth.admin.deleteUser(invitation.user.id)
    return response({ error: "Le profil d’accès n’a pas pu être créé." }, 500, origin)
  }

  return response({ ok: true, email, role }, 200, origin)
})
