import { ArrowDownRight, ArrowRight, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import type { Product } from "../types";
import { ProductCard } from "../components/ProductCard";

const fallbackProducts: Product[] = [
 { id: "p1", name: "Arc Wireless Headphones", slug: "arc-wireless-headphones", description: "Balanced sound, comfortable fit, and up to thirty hours of listening.", category: "Audio", imageUrl: "/images/arc-wireless-headphones.jpg", priceCents: 12900, stock: 24 },
 { id: "p2", name: "Studio Desk Lamp", slug: "studio-desk-lamp", description: "A warm, dimmable desk lamp designed for focused work.", category: "Workspace", imageUrl: "/images/studio-desk-lamp.jpg", priceCents: 7900, stock: 18 },
 { id: "p3", name: "Everyday Carry Pack", slug: "everyday-carry-pack", description: "A weather-resistant daily backpack with a padded laptop sleeve.", category: "Accessories", imageUrl: "/images/everyday-carry-pack.jpg", priceCents: 9900, stock: 12 },
 { id: "p4", name: "Mechanical Keyboard", slug: "mechanical-keyboard", description: "Compact mechanical keyboard with tactile switches and USB-C.", category: "Workspace", imageUrl: "/images/mechanical-keyboard.jpg", priceCents: 11500, stock: 31 },
 { id: "p5", name: "Ceramic Travel Mug", slug: "ceramic-travel-mug", description: "Double-wall ceramic mug for slow mornings and long commutes.", category: "Accessories", imageUrl: "/images/ceramic-travel-mug.jpg", priceCents: 3200, stock: 40 },
 { id: "p6", name: "Portable Bluetooth Speaker", slug: "portable-bluetooth-speaker", description: "Room-filling sound in a compact, water-resistant shell.", category: "Audio", imageUrl: "/images/portable-bluetooth-speaker.jpg", priceCents: 6800, stock: 16 }
];

export function HomePage() {
 const [params, setParams] = useSearchParams();
 const [products, setProducts] = useState<Product[]>(fallbackProducts);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [category, setCategory] = useState("All objects");
 const [sort, setSort] = useState("newest");
 const query = params.get("q") ?? "";
 useEffect(() => {
   let active = true; setLoading(true); setError("");
   api<{ data: Product[] }>(`/products?q=${encodeURIComponent(query)}&limit=50`).then((result) => { if (active) setProducts(result.data); }).catch(() => { if (active) setError("Showing the local preview catalog. Start the API for live inventory."); }).finally(() => { if (active) setLoading(false); });
   return () => { active = false; };
 }, [query]);
 const categories = useMemo(() => ["All objects", ...Array.from(new Set(products.map((p) => p.category)))], [products]);
 const visible = useMemo(() => products.filter((p) => (category === "All objects" || p.category === category) && `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "price-asc" ? a.priceCents-b.priceCents : sort === "price-desc" ? b.priceCents-a.priceCents : 0), [products, category, sort, query]);
 return <main>
  <section className="hero"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line"/> Objects with intention</p><h1>Good things.<br/><em>Well chosen.</em></h1><p className="hero-description">Everyday essentials with a little more thought behind them. Useful by design, made to stay.</p><a href="#edit" className="button button-dark">Explore the collection <ArrowRight size={16}/></a><div className="hero-note"><span>01 / 03</span><span>Less, but better.</span><ArrowDownRight size={18}/></div></div><div className="hero-visual"><img src="/images/hero.jpg" alt="Thoughtfully arranged everyday objects on a warm studio shelf"/><div className="hero-image-label"><span>THE EVERYDAY EDIT</span><span>Vol. 04 — 2026</span></div><div className="hero-stamp">Made for<br/>the everyday<span>✳</span></div></div></section>
  <section className="value-strip" id="story"><div><span className="value-number">01</span><p>Useful by nature</p></div><div><span className="value-number">02</span><p>Considered materials</p></div><div><span className="value-number">03</span><p>Keep it for longer</p></div><a href="#edit">Our point of view <ArrowRight size={15}/></a></section>
  <section className="collection section-shell" id="edit"><div className="section-heading"><div><p className="eyebrow">The considered collection</p><h2>Meet your new <em>favourites.</em></h2></div><p className="section-aside">A small collection of very useful things.<br/>Nothing extra, nothing accidental.</p></div>
   <div className="collection-controls"><div className="category-tabs" aria-label="Filter by category">{categories.map((item) => <button key={item} className={category === item ? "category-tab active" : "category-tab"} onClick={() => setCategory(item)}>{item}</button>)}</div><label className="sort-control"><SlidersHorizontal size={15}/><span>Sort by</span><select aria-label="Sort products" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label></div>
   {error && <p className="inline-notice">{error}</p>}{loading && <p className="loading-note">Checking the collection…</p>}
   {visible.length ? <div className="product-grid">{visible.map((product, index) => <ProductCard key={product.id} product={product} index={index}/>)}</div> : <div className="empty-state"><h3>No objects found.</h3><p>Try another search or category.</p><button className="text-button" onClick={() => { setCategory("All objects"); setParams({}); }}>Clear filters <ArrowRight size={15}/></button></div>}
  </section>
  <section className="manifesto"><div className="manifesto-mark">N.</div><div><p className="eyebrow">A note on buying less</p><h2>Keep the things<br/>that <em>make sense.</em></h2></div><p>We think the best objects earn their place. They work hard, feel good to use, and don't ask for much attention. That's the whole idea.</p><a href="#edit" aria-label="Back to collection"><ArrowRight size={20}/></a></section>
 </main>;
}
