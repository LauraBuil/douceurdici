import { usePath } from "./lib/navigation";
import { Admin } from "./components/admin/AdminShell";
import { Home } from "./pages/HomePage";
import { Catalogue } from "./pages/CataloguePage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { GalleryPage } from "./pages/GalleryPage";
import { MarketsPage } from "./pages/MarketsPage";
import { LegalNoticePage } from "./pages/LegalNoticePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CartPage } from "./pages/CartPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { OrderHistoryPage } from "./pages/OrderHistoryPage";

export default function App() {
  const path = usePath();
  const pathname = path.split("?")[0];
  if (pathname.startsWith("/admin")) return <Admin />;
  if (pathname === "/panier") return <CartPage />;
  if (pathname === "/commande-confirmee") return <OrderConfirmationPage />;
  if (pathname === "/mes-commandes") return <OrderHistoryPage />;
  if (pathname.startsWith("/produit/"))
    return (
      <ProductDetailPage
        slug={decodeURIComponent(pathname.replace("/produit/", ""))}
      />
    );
  if (pathname.startsWith("/catalogue")) return <Catalogue />;
  if (pathname.startsWith("/galerie")) return <GalleryPage />;
  if (pathname.startsWith("/marches")) return <MarketsPage />;
  if (pathname.startsWith("/mentions-legales")) return <LegalNoticePage />;
  if (pathname === "/") return <Home />;
  return <NotFoundPage />;
}
