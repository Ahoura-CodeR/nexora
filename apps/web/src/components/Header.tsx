import { ArrowUpRight, Menu, Search, ShoppingBag, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

export function Header() {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  function submitSearch(event: FormEvent) { event.preventDefault(); navigate(`/?q=${encodeURIComponent(query)}`); setMenuOpen(false); }
  return <>
    <div className="announcement">A little more considered. Free shipping on orders over $100.</div>
    <header className="site-header">
      <button className="icon-button mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20}/> : <Menu size={20}/>}</button>
      <Link className="wordmark" to="/">NEXORA<span>®</span></Link>
      <nav className={menuOpen ? "main-nav open" : "main-nav"}>
        <NavLink to="/" onClick={() => setMenuOpen(false)}>Shop all</NavLink>
        <a href="/#edit" onClick={() => setMenuOpen(false)}>The edit</a>
        <a href="/#story" onClick={() => setMenuOpen(false)}>Our approach</a>
      </nav>
      <div className="header-actions">
        <form className="header-search" onSubmit={submitSearch}><Search size={17}/><input aria-label="Search products" placeholder="Search objects" value={query} onChange={(e) => setQuery(e.target.value)}/></form>
        <Link to="/cart" className="cart-link" aria-label={`Shopping bag, ${count} items`}><ShoppingBag size={19}/><span>Bag ({count})</span></Link>
        <Link className="admin-link" to="/admin">Admin <ArrowUpRight size={14}/></Link>
      </div>
    </header>
  </>;
}
