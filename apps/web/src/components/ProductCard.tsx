import { ArrowUpRight, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../types";
import { useCart } from "../context/CartContext";

export function money(cents: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(cents / 100); }
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add } = useCart();
  return <article className="product-card" style={{ animationDelay: `${index * 65}ms` }}>
    <Link to={`/products/${product.slug}`} className="product-image-wrap"><img src={product.imageUrl} alt={product.name} loading="lazy"/><span className="image-arrow"><ArrowUpRight size={17}/></span>{product.stock <= 5 && <span className="stock-tag">Almost gone</span>}</Link>
    <div className="product-info"><div><p className="product-category">{product.category}</p><Link to={`/products/${product.slug}`} className="product-name">{product.name}</Link></div><span className="product-price">{money(product.priceCents)}</span></div>
    <button className="quick-add" onClick={() => add(product)} disabled={product.stock < 1}><Plus size={15}/>{product.stock < 1 ? "Out of stock" : "Add to bag"}</button>
  </article>;
}
