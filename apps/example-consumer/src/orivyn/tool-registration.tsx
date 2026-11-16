"use client";

import {
  catalogManifest,
  type CatalogCategory,
  type CatalogPage,
} from "./manifest";
import { useOrivynTool } from "./hooks";

/** These are consumer-owned handlers, not Orivyn-internal source imports. */
export function CatalogToolRegistration() {
  const [open, filter, select] = catalogManifest.tools;
  useOrivynTool({
    definition: open,
    execute: (state, args) => ({
      ...state,
      page: args.page as CatalogPage,
      selected: null,
    }),
  });
  useOrivynTool({
    definition: filter,
    available: (context) => context.route === "/catalog",
    execute: (state, args) => ({
      ...state,
      category: args.category as CatalogCategory,
      selected: null,
    }),
  });
  useOrivynTool({
    definition: select,
    available: (context) => context.route === "/catalog",
    execute: (state, args) => ({
      ...state,
      selected: args.id as string,
    }),
  });
  return null;
}
