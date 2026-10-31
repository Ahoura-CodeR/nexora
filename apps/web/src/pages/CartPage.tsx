import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { money } from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";

export function CartPage() {
 const { items, totalCents, setQuantity, remove, clear } = useCart(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const navigate = useNavigate();
 async function checkout() {
  setBusy(true); setMessage("");
  try {
   await api<{data:{id:string}}>('/auth/me');
   const key = sessionStorage.getItem("nexora-checkout-key") ?? `checkout-${crypto.randomUUID()}`;
   sessionStorage.setItem("nexora-checkout-key", key);
   const result = await api<{data:{id:string}}>("/orders", { method: "POST", body: JSON.stringify({ items: items.map(({product, quantity}) => ({productId: product.id, quantity})), idempotencyKey: key }) });
   sessionStorage.removeItem("nexora-checkout-key");
   clear(); navigate(`/order-confirmation/${result.data.id}`);
  } catch (error) { setMessage(error instanceof Error ? error.message : "Please sign in and try again."); if (String(error).includes("Sign in")) navigate("/account"); }
  finally { setBusy(false); }
 }
 return <main className="simple-page section-shell"><Link to="/" className="back-link"><ArrowLeft size={16}/> Continue shopping</Link><div className="cart-heading"><div><p className="eyebrow">Your considered choices</p><h1>Your bag<span> ({items.length})</span></h1></div><ShoppingBag size={28} strokeWidth={1.4}/></div>
 {items.length === 0 ? <div className="empty-state"><div className="empty-icon"><ShoppingBag size={25}/></div><h2>Nothing in here. Yet.</h2><p>Good things are just a few clicks away.</p><Link to="/" className="button button-dark">Explore the collection <ArrowRight size={16}/></Link></div> : <div className="cart-layout"><div className="cart-items">{items.map(({product, quantity}) => <article className="cart-item" key={product.id}><img src={product.imageUrl} alt={product.name}/><div className="cart-item-main"><p className="product-category">{product.category}</p><Link to={`/products/${product.slug}`} className="product-name">{product.name}</Link><p className="cart-item-price">{money(product.priceCents)}</p><div className="quantity-control"><button aria-label={`Decrease ${product.name}`} onClick={() => setQuantity(product.id, quantity-1)} disabled={quantity <= 1}><Minus size={14}/></button><span>{quantity}</span><button aria-label={`Increase ${product.name}`} onClick={() => setQuantity(product.id, quantity+1)} disabled={quantity >= product.stock}><Plus size={14}/></button></div></div><div className="cart-item-end"><strong>{money(product.priceCents*quantity)}</strong><button className="remove-button" onClick={() => remove(product.id)} aria-label={`Remove ${product.name}`}><Trash2 size={16}/></button></div></article>)}</div><aside className="order-summary"><p className="eyebrow">The small print</p><h2>Order summary</h2><div className="summary-line"><span>Subtotal</span><span>{money(totalCents)}</span></div><div className="summary-line"><span>Shipping</span><span>{totalCents >= 10000 ? "Complimentary" : "$8.00"}</span></div><div className="summary-line total"><span>Total</span><strong>{money(totalCents + (totalCents >= 10000 ? 0 : 800))}</strong></div><p className="summary-note">Taxes calculated at checkout. Payments are simulated in this portfolio build.</p><button className="button button-dark checkout-button" disabled={busy} onClick={checkout}>{busy ? "Processing…" : "Continue to checkout"} <ArrowRight size={16}/></button>{message && <p role="alert" className="form-error">{message}</p>}<p className="secure-note">Secure checkout · Easy returns</p></aside></div>}
 </main>;
}
