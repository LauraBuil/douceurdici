import { useEffect, useState } from "react";
import { ClipboardList, LoaderCircle, Mail, Package } from "lucide-react";
import { formatPrice } from "../../data";
import { supabase } from "../../lib/supabase";

type OrderItem = {
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price: number;
  quantity: number;
  is_preorder: boolean;
  color_name: string | null;
  fragrance_name: string | null;
};

type Order = {
  id: string;
  status: string;
  subtotal: number;
  customer_email: string | null;
  customer_name: string | null;
  paid_at: string | null;
  created_at: string;
  items: OrderItem[];
};

type OrderTab = "orders" | "preorders" | "products";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function statusLabel(status: string) {
  if (status === "paid") return "Payée";
  if (status === "fulfilled") return "Préparée";
  if (status === "reserved") return "Réservée";
  return status;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<OrderTab>("orders");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      supabase!
        .from("orders")
        .select(
          "id,status,subtotal,customer_email,customer_name,paid_at,created_at",
        )
        .not("status", "in", "(cancelled,expired)")
        .order("created_at", { ascending: false }),
      supabase!
        .from("order_items")
        .select(
          "order_id,product_id,product_name,unit_price,quantity,is_preorder,color_name,fragrance_name",
        ),
    ]).then(([{ data: orderData }, { data: itemData }]) => {
      if (!active) return;
      const itemsByOrder = new Map<string, OrderItem[]>();
      for (const item of (itemData ?? []) as OrderItem[]) {
        const items = itemsByOrder.get(item.order_id) ?? [];
        items.push(item);
        itemsByOrder.set(item.order_id, items);
      }
      setOrders(
        ((orderData ?? []) as Omit<Order, "items">[]).map((order) => ({
          ...order,
          items: itemsByOrder.get(order.id) ?? [],
        })),
      );
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const paidOrders = orders.filter((order) =>
    ["paid", "fulfilled"].includes(order.status),
  );
  const displayedOrders = paidOrders.filter((order) => {
    const hasPreorder = order.items.some((item) => item.is_preorder);
    return tab === "preorders" ? hasPreorder : !hasPreorder;
  });
  const productSummary = (() => {
    const summary = new Map<
      string,
      { name: string; quantity: number; total: number; preorder: number }
    >();
    for (const order of paidOrders) {
      for (const item of order.items) {
        const key = item.product_id ?? item.product_name;
        const current = summary.get(key) ?? {
          name: item.product_name,
          quantity: 0,
          total: 0,
          preorder: 0,
        };
        current.quantity += item.quantity;
        current.total += Number(item.unit_price) * item.quantity;
        if (item.is_preorder) current.preorder += item.quantity;
        summary.set(key, current);
      }
    }
    return [...summary.values()].sort((a, b) => b.quantity - a.quantity);
  })();

  if (loading) {
    return (
      <div className="admin-loading-inline">
        <LoaderCircle className="spin" /> Chargement des commandes…
      </div>
    );
  }

  return (
    <section className="admin-orders">
      <div className="admin-tabs" role="tablist" aria-label="Commandes">
        <button
          className={tab === "orders" ? "active" : ""}
          onClick={() => setTab("orders")}
          role="tab"
        >
          Commandes (
          {
            paidOrders.filter(
              (order) => !order.items.some((item) => item.is_preorder),
            ).length
          }
          )
        </button>
        <button
          className={tab === "preorders" ? "active" : ""}
          onClick={() => setTab("preorders")}
          role="tab"
        >
          Précommandes (
          {
            paidOrders.filter((order) =>
              order.items.some((item) => item.is_preorder),
            ).length
          }
          )
        </button>
        <button
          className={tab === "products" ? "active" : ""}
          onClick={() => setTab("products")}
          role="tab"
        >
          Par produits
        </button>
      </div>
      {tab === "products" ? (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Quantité vendue</th>
                <th>Précommandes</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {productSummary.map((product) => (
                <tr key={product.name}>
                  <td>
                    <strong>{product.name}</strong>
                  </td>
                  <td>{product.quantity}</td>
                  <td>{product.preorder || "—"}</td>
                  <td>{formatPrice(product.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!productSummary.length && (
            <div className="empty-state">
              <Package />
              <h2>Aucune vente pour le moment.</h2>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-order-list">
          {displayedOrders.map((order) => (
            <article className="admin-order-card" key={order.id}>
              <header>
                <div>
                  <span className="eyebrow">
                    Commande #{order.id.slice(0, 8)}
                  </span>
                  <h2>{order.customer_name || "Client non renseigné"}</h2>
                  <p>
                    <Mail /> {order.customer_email || "Email non renseigné"}
                  </p>
                </div>
                <div className="admin-order-meta">
                  <span className="status status--published">
                    {statusLabel(order.status)}
                  </span>
                  <time dateTime={order.paid_at ?? order.created_at}>
                    {dateFormatter.format(
                      new Date(order.paid_at ?? order.created_at),
                    )}
                  </time>
                </div>
              </header>
              <ul>
                {order.items.map((item, index) => (
                  <li
                    key={`${order.id}-${item.product_id ?? item.product_name}-${index}`}
                  >
                    <span>
                      {item.quantity} × {item.product_name}
                      {item.color_name ? ` · ${item.color_name}` : ""}
                      {item.fragrance_name ? ` · ${item.fragrance_name}` : ""}
                    </span>
                    <strong>
                      {formatPrice(Number(item.unit_price) * item.quantity)}
                    </strong>
                  </li>
                ))}
              </ul>
              <footer>
                <span>Total</span>
                <strong>{formatPrice(Number(order.subtotal))}</strong>
              </footer>
            </article>
          ))}
          {!displayedOrders.length && (
            <div className="empty-state">
              <ClipboardList />
              <h2>Aucune commande dans cet onglet.</h2>
              <p>Les commandes payées apparaîtront ici.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
