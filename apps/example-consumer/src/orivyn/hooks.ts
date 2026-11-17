import { createOrivynApp } from "@orivyn/react";
import { type CatalogState, catalogManifest } from "./manifest";

export const {
  Provider: CatalogProvider,
  useOrivyn: useCatalog,
  useOrivynTool,
} = createOrivynApp<CatalogState>(catalogManifest);
