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

  let payload: { email?: string; code?: string }
  try { payload = await request.json() } catch { return response({ error: "Informations invalides." }, 400, origin) }
  const email = payload.email?.trim().toLowerCase() ?? ""
  const code = payload.code?.trim() ?? ""
  if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(code)) return response({ error: "Code invalide ou expiré." }, 400, origin)

  const codeHash = await hashCode(email, code)
  const { data: accessCode } = await supabase.from("customer_order_access_codes").select("id,code_hash,attempts,expires_at").eq("email", email).order("created_at", { ascending: false }).limit(1).maybeSingle()
  if (!accessCode || new Date(accessCode.expires_at).getTime() <= Date.now() || accessCode.attempts >= 5 || accessCode.code_hash !== codeHash) {
    if (accessCode && accessCode.attempts < 5) await supabase.from("customer_order_access_codes").update({ attempts: accessCode.attempts + 1 }).eq("id", accessCode.id)
    return response({ error: "Code invalide ou expiré." }, 400, origin)
  }
  await supabase.from("customer_order_access_codes").delete().eq("id", accessCode.id)

  const { data: orders, error } = await supabase.from("orders").select("id,status,subtotal,shipping_amount,total,shipping_address,created_at,paid_at,order_items(product_name,unit_price,quantity,is_preorder,color_name,fragrance_name)").eq("customer_email", email).in("status", ["paid", "fulfilled"]).order("created_at", { ascending: false })
  if (error) return response({ error: "L’historique n’a pas pu être chargé." }, 500, origin)
  return response({ orders: orders ?? [] }, 200, origin)
})
