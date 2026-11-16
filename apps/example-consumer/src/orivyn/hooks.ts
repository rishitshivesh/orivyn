import { createOrivynApp } from "@orivyn/react";
import { catalogManifest, type CatalogState } from "./manifest";

export const {
  Provider: CatalogProvider,
  useOrivyn: useCatalog,
  useOrivynTool,
} = createOrivynApp<CatalogState>(catalogManifest);
