import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2.116.0"

const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } })
const allowedHosts = new Set(["douceurdici.com", "www.douceurdici.com", "dev.douceurdici.com", "localhost", "127.0.0.1"])

function response(body: Record<string, unknown>, status: number, origin: string) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" } })
}

async function hashCode(email: string, code: string) {
  const input = `${email}:${code}:${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""}`
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("")
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get("origin") ?? "https://dev.douceurdici.com"
  let origin = "https://dev.douceurdici.com"
  try { const parsed = new URL(requestOrigin); if (allowedHosts.has(parsed.hostname)) origin = parsed.origin } catch { /* Safe default. */ }
  if (request.method === "OPTIONS") return response({ ok: true }, 200, origin)
  if (request.method !== "POST") return response({ error: "Méthode non autorisée." }, 405, origin)

  let payload: { email?: string }
  try { payload = await request.json() } catch { return response({ error: "Informations invalides." }, 400, origin) }
  const email = payload.email?.trim().toLowerCase() ?? ""
  if (!/^\S+@\S+\.\S+$/.test(email)) return response({ error: "Adresse email invalide." }, 400, origin)

  const { count } = await supabase.from("customer_order_access_codes").select("id", { count: "exact", head: true }).eq("email", email).gt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
  if ((count ?? 0) >= 3) return response({ ok: true }, 200, origin)

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, "0")
  const codeHash = await hashCode(email, code)
  await supabase.from("customer_order_access_codes").delete().eq("email", email)
  const { error } = await supabase.from("customer_order_access_codes").insert({ email, code_hash: codeHash, expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
  if (error) return response({ error: "Le code n’a pas pu être généré." }, 500, origin)

  const apiKey = Deno.env.get("RESEND_API_KEY")
  const sender = Deno.env.get("RESEND_FROM_EMAIL")
  if (!apiKey || !sender) return response({ error: "Le service email n’est pas configuré." }, 500, origin)
  const emailResponse = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: sender, to: [email], subject: "Votre code d’accès à vos commandes", html: `<h1>Votre code d’accès</h1><p>Voici votre code pour consulter vos commandes :</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>Ce code est valable 10 minutes et ne peut être utilisé qu’une seule fois.</p>` }) })
  if (!emailResponse.ok) return response({ error: "Le code n’a pas pu être envoyé." }, 502, origin)
  return response({ ok: true }, 200, origin)
})
