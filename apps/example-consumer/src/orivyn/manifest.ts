import { defineApplication } from "@orivyn/runtime";

export type CatalogPage = "catalog" | "about";
export type CatalogCategory = "all" | "audio" | "books" | "workspace";
export type CatalogState = {
  page: CatalogPage;
  category: CatalogCategory;
  selected: string | null;
};

export const initialCatalogState: CatalogState = { page: "catalog", category: "all", selected: null };

export const catalogManifest = defineApplication({
  id: "orivyn.catalog-demo",
  name: "Independent Catalog",
  version: "0.5.0",
  runtime: "browser",
  tools: [
    {
      name: "catalog.open",
      description: "Open the catalog or about page in this demonstration app.",
      execution: "browser",
      risk: "read",
      parameters: {
        type: "object",
        properties: { page: { type: "string", enum: ["catalog", "about"] } },
        required: ["page"],
        additionalProperties: false,
      },
    },
    {
      name: "catalog.filter",
      description: "Filter visible catalog items by category audio, books, workspace or all. Available only on the catalog page.",
      execution: "browser",
      risk: "read",
      parameters: {
        type: "object",
        properties: { category: { type: "string", enum: ["all", "audio", "books", "workspace"] } },
        required: ["category"],
        additionalProperties: false,
      },
    },
    {
      name: "catalog.select",
      description: "Select an item by its exact ID: headphones, keyboard or notebook. Available only on the catalog page.",
      execution: "browser",
      risk: "read",
      parameters: {
        type: "object",
        properties: { id: { type: "string", enum: ["headphones", "keyboard", "notebook"] } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  ],
});
