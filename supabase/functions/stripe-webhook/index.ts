import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import Stripe from "npm:stripe@18.5.0"
import { createClient } from "npm:@supabase/supabase-js@2.116.0"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2025-06-30.basil" })
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", { auth: { persistSession: false } })

async function notifyAdmin(orderId: string) {
  const apiKey = Deno.env.get("RESEND_API_KEY")
  const recipient = Deno.env.get("ADMIN_NOTIFICATION_EMAIL")
  const sender = Deno.env.get("RESEND_FROM_EMAIL")
  if (!apiKey || !recipient || !sender) return
  const { data: order } = await supabase.from("orders").select("id,subtotal,shipping_amount,total,customer_email,customer_name,shipping_address,order_items(product_name,quantity,is_preorder)").eq("id", orderId).maybeSingle()
  if (!order) return
  const address = order.shipping_address as { line1?: string; line2?: string; postalCode?: string; city?: string } | null
  const addressLabel = address ? `${address.line1 ?? ""}${address.line2 ? `, ${address.line2}` : ""}, ${address.postalCode ?? ""} ${address.city ?? ""}` : "Non renseignée"
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: sender, to: [recipient], subject: `Nouvelle commande payée #${order.id.slice(0, 8)}`, html: `<h2>Nouvelle commande payée</h2><p>Client : ${order.customer_name ?? "Non renseigné"} (${order.customer_email ?? "Non renseigné"})</p><p>Adresse de livraison : ${addressLabel}</p><p>Sous-total : ${Number(order.subtotal).toFixed(2)} €</p><p>Livraison : ${Number(order.shipping_amount ?? 0).toFixed(2)} €</p><p>Total : ${Number(order.total ?? order.subtotal).toFixed(2)} €</p><p>La commande est visible dans l’administration.</p>` }) })
  await supabase.from("orders").update({ notification_sent_at: new Date().toISOString() }).eq("id", orderId)
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
      if (!error) await notifyAdmin(orderId)
    }
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    if (orderId) await supabase.rpc("release_order_reservation", { p_order_id: orderId })
  }
  return new Response(JSON.stringify({ received: true }), { headers: { "Content-Type": "application/json" } })
})
