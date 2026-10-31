export type Product = { id: string; name: string; slug: string; description: string; category: string; imageUrl: string; priceCents: number; stock: number };
export type CartItem = { product: Product; quantity: number };
