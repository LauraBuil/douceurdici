import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from "npm:stripe@18.5.0"
import { createClient } from "npm:@supabase/supabase-js@2.116.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-06-30.basil" })
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } })

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

async function sendEmail(apiKey: string, sender: string, recipient: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: sender, to: [recipient], subject, html }),
  })
  return response.ok
}

async function notifyOrderParties(orderId: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY")
  const adminRecipient = Deno.env.get("ADMIN_NOTIFICATION_EMAIL")
  const sender = Deno.env.get("RESEND_FROM_EMAIL")
  if (!apiKey || !adminRecipient || !sender) return false
  const { data: order } = await supabase.from("orders").select("id,subtotal,shipping_amount,total,customer_email,customer_name,shipping_address,order_items(product_name,quantity,is_preorder)").eq("id", orderId).maybeSingle()
  if (!order) return false
  const address = order.shipping_address as { line1?: string; line2?: string; postalCode?: string; city?: string } | null
  const addressLabel = address ? `${address.line1 ?? ""}${address.line2 ? `, ${address.line2}` : ""}, ${address.postalCode ?? ""} ${address.city ?? ""}` : "Non renseignée"
  const items = (order.order_items ?? []).map((item: { product_name: string; quantity: number; is_preorder: boolean }) => `<li>${escapeHtml(item.quantity)} × ${escapeHtml(item.product_name)}${item.is_preorder ? " <em>(précommande)</em>" : ""}</li>`).join("")
  const recap = `<h2>Commande #${escapeHtml(order.id.slice(0, 8))}</h2><ul>${items}</ul><p>Sous-total : ${Number(order.subtotal).toFixed(2)} €</p><p>Livraison : ${Number(order.shipping_amount ?? 0).toFixed(2)} €</p><p><strong>Total : ${Number(order.total ?? order.subtotal).toFixed(2)} €</strong></p><p>Adresse de livraison : ${escapeHtml(addressLabel)}</p>`
  const customerEmail = order.customer_email ? sendEmail(apiKey, sender, order.customer_email, `Confirmation de votre commande #${order.id.slice(0, 8)}`, `<h1>Merci pour votre commande</h1><p>Bonjour ${escapeHtml(order.customer_name || "")},</p>${recap}<p>Nous vous tiendrons informé(e) de la préparation et de l’expédition.</p>`) : Promise.resolve(true)
  const adminEmail = sendEmail(apiKey, sender, adminRecipient, `Nouvelle commande payée #${order.id.slice(0, 8)}`, `<h1>Nouvelle commande payée</h1><p>Client : ${escapeHtml(order.customer_name || "Non renseigné")} (${escapeHtml(order.customer_email || "Non renseigné")})</p>${recap}<p>La commande est visible dans l’administration.</p>`)
  const [customerSent, adminSent] = await Promise.all([customerEmail, adminEmail])
  if (customerSent && adminSent) await supabase.from("orders").update({ notification_sent_at: new Date().toISOString() }).eq("id", orderId)
  return customerSent && adminSent
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 })
  const signature = request.headers.get("stripe-signature")
  if (!signature) return new Response("Missing signature", { status: 400 })
  const body = await request.text()
  let event: Stripe.Event
  try { event = await stripe.webhooks.constructEventAsync(body, signature, Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "") } catch { return new Response("Invalid signature", { status: 400 }) }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId && session.payment_status === "paid") {
      const { error } = await supabase.from("orders").update({ status: "paid", paid_at: new Date().toISOString(), stripe_payment_intent_id: typeof session.payment_intent === "string" ? session.payment_intent : null }).eq("id", orderId).eq("status", "reserved")
      if (!error) await notifyOrderParties(orderId)
    }
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) await supabase.rpc("release_order_reservation", { p_order_id: orderId })
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } })
})
