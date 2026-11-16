import type { CatalogCategory } from "./manifest";

export const catalogItems: readonly {
  id: string;
  name: string;
  category: Exclude<CatalogCategory, "all">;
  description: string;
  price: string;
}[] = [
  { id: "headphones", name: "Studio Headphones", category: "audio", description: "Reference listening and creative focus.", price: "₹9,990" },
  { id: "keyboard", name: "Mechanical Keyboard", category: "workspace", description: "A clean desktop companion.", price: "₹6,490" },
  { id: "notebook", name: "Design Notebook", category: "books", description: "Paper thinking for digital products.", price: "₹890" },
];
