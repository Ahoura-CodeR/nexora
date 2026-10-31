import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const products = [
  { name: "Arc Wireless Headphones", slug: "arc-wireless-headphones", description: "Balanced sound, comfortable fit, and up to  thirty hours of listening.", category: "Audio", imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85", priceCents: 12900, stock: 24 },
  { name: "Studio Desk Lamp", slug: "studio-desk-lamp", description: "A warm, dimmable desk lamp designed for focused work.", category: "Workspace", imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85", priceCents: 7900, stock: 18 },
  { name: "Everyday Carry Pack", slug: "everyday-carry-pack", description: "A weather-resistant daily backpack with a padded laptop sleeve.", category: "Accessories", imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85", priceCents: 9900, stock: 12 },
  { name: "Mechanical Keyboard", slug: "mechanical-keyboard", description: "Compact mechanical keyboard with tactile switches and USB-C.", category: "Workspace", imageUrl: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=85", priceCents: 11500, stock: 31 },
  { name: "Ceramic Travel Mug", slug: "ceramic-travel-mug", description: "Double-wall ceramic mug for slow mornings and long commutes.", category: "Accessories", imageUrl: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85", priceCents: 3200, stock: 40 },
  { name: "Portable Bluetooth Speaker", slug: "portable-bluetooth-speaker", description: "Room-filling sound in a compact, water-resistant shell.", category: "Audio", imageUrl: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85", priceCents: 6800, stock: 16 }
];

async function main() {
  const email = "admin@nexora.local";
  const passwordHash = await bcrypt.hash("ChangeMe123!", 12);
  await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: "Nexora Admin", passwordHash, role: Role.ADMIN } });
  for (const product of products) await prisma.product.upsert({ where: { slug: product.slug }, update: product, create: product });
  console.info(`Seeded ${products.length} products and the local admin account.`);
}

main().finally(() => prisma.$disconnect());
