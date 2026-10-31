import { BrowserRouter, Route, Routes } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { AccountPage } from "./pages/AccountPage";
import { AdminPage } from "./pages/AdminPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";

export default function App() { return <BrowserRouter><CartProvider><Header/><Routes><Route path="/" element={<HomePage/>}/><Route path="/products/:slug" element={<ProductPage/>}/><Route path="/cart" element={<CartPage/>}/><Route path="/account" element={<AccountPage/>}/><Route path="/admin" element={<AdminPage/>}/><Route path="/order-confirmation/:id" element={<OrderConfirmationPage/>}/><Route path="*" element={<main className="simple-page"><h1>That page wandered off.</h1><a href="/">Back to NEXORA</a></main>}/></Routes><Footer/></CartProvider></BrowserRouter>; }
