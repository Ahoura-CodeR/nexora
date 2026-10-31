import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import { ProductCard, money } from "./ProductCard";
import type { Product } from "../types";

const product: Product = { id: "product-1", name: "Studio Desk Lamp", slug: "studio-desk-lamp", description: "A warm desk lamp.", category: "Workspace", imageUrl: "/lamp.jpg", priceCents: 7900, stock: 3 };

describe("ProductCard", () => {
  it("renders product details and an add-to-bag action", () => {
    render(<MemoryRouter><CartProvider><ProductCard product={product}/></CartProvider></MemoryRouter>);
    expect(screen.getByText("Studio Desk Lamp")).toBeInTheDocument();
    expect(screen.getByText("$79.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add to bag/i })).toBeEnabled();
  });
  it("formats integer cents as currency", () => { expect(money(3250)).toBe("$32.50"); });
});
