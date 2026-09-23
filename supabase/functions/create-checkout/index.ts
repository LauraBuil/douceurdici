import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from "npm:stripe@18.5.0"
import { createClient } from "npm:@supabase/supabase-js@2.116.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-06-30.basil" })
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } })
const allowedHosts = new Set(["douceurdici.com", "www.douceurdici.com", "dev.douceurdici.com", "localhost", "127.0.0.1"])

function response(body: Record<string, unknown>, status: number, origin: string) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" } })
}

Deno.serve(async (request) => {
  const requestOrigin = request.headers.get("origin") ?? "https://dev.douceurdici.com"
  let origin = "https://dev.douceurdici.com"
  try { const parsed = new URL(requestOrigin); if (allowedHosts.has(parsed.hostname)) origin = parsed.origin } catch { /* Use the safe default. */ }
  if (request.method === "OPTIONS") return response({ ok: true }, 200, origin)
  if (request.method !== "POST") return response({ error: "Méthode non autorisée." }, 405, origin)

  let payload: {
    items?: unknown
    customerEmail?: string
    customerName?: string
    shippingAddress?: {
      fullName?: string
      line1?: string
      line2?: string
      postalCode?: string
      city?: string
      country?: string
    }
    appUrl?: string
  }
  try { payload = await request.json() } catch { return response({ error: "Informations invalides." }, 400, origin) }
  const customerEmail = payload.customerEmail?.trim().toLowerCase() ?? ""
  const customerName = payload.customerName?.trim() ?? ""
  const shippingAddress = {
    fullName: payload.shippingAddress?.fullName?.trim() ?? "",
    line1: payload.shippingAddress?.line1?.trim() ?? "",
    line2: payload.shippingAddress?.line2?.trim() ?? "",
    postalCode: payload.shippingAddress?.postalCode?.trim() ?? "",
    city: payload.shippingAddress?.city?.trim() ?? "",
    country: payload.shippingAddress?.country?.trim() ?? "France",
  }
  if (!/^\S+@\S+\.\S+$/.test(customerEmail) || !Array.isArray(payload.items) || payload.items.length === 0) return response({ error: "Adresse email ou panier invalide." }, 400, origin)
  if (!shippingAddress.fullName || !shippingAddress.line1 || !shippingAddress.postalCode || !shippingAddress.city) return response({ error: "Adresse de livraison incomplète." }, 400, origin)

  const { data: reservation, error: reservationError } = await supabase.rpc("create_order_reservation", { p_items: payload.items })
  if (reservationError || !reservation?.order_id) return response({ error: reservationError?.message ?? "Le stock n’est plus disponible." }, 409, origin)

  const { data: lines, error: linesError } = await supabase.from("order_items").select("product_name,unit_price,quantity").eq("order_id", reservation.order_id)
  if (linesError) { await supabase.rpc("release_order_reservation", { p_order_id: reservation.order_id }); return response({ error: "La commande n’a pas pu être préparée." }, 500, origin) }

  const { data: shippingSetting } = await supabase.from("site_settings").select("numeric_value").eq("id", "shipping_rate").maybeSingle()
  const shippingAmount = Math.max(0, Number(shippingSetting?.numeric_value ?? 0))
  const subtotal = Number(reservation.subtotal ?? 0)
  const total = subtotal + shippingAmount

  let appUrl = Deno.env.get("PUBLIC_APP_URL") ?? origin
  try {
    const requestedAppUrl = payload.appUrl ? new URL(payload.appUrl) : null
    if (requestedAppUrl && requestedAppUrl.origin === origin) appUrl = requestedAppUrl.toString().replace(/\/$/, "")
  } catch { /* Keep the configured safe default. */ }
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: [
      ...(lines ?? []).map((line) => ({ price_data: { currency: "eur", product_data: { name: line.product_name }, unit_amount: Math.round(Number(line.unit_price) * 100) }, quantity: line.quantity })),
      ...(shippingAmount > 0 ? [{ price_data: { currency: "eur", product_data: { name: "Frais de livraison" }, unit_amount: Math.round(shippingAmount * 100) }, quantity: 1 }] : []),
    ],
    metadata: { order_id: reservation.order_id },
    success_url: `${appUrl}/commande-confirmee?order_id=${reservation.order_id}`,
    cancel_url: `${appUrl}/panier`,
  })

  await supabase.from("orders").update({ customer_email: customerEmail, customer_name: customerName || null, shipping_address: shippingAddress, shipping_amount: shippingAmount, total, stripe_checkout_session_id: session.id }).eq("id", reservation.order_id)
  return response({ checkout_url: session.url, order_id: reservation.order_id }, 200, origin)
})
