"use client";

import { CatalogWorkspace } from "@/components/catalog-workspace";
import { CatalogProvider } from "@/orivyn/hooks";
import { catalogManifest, initialCatalogState } from "@/orivyn/manifest";
import { CatalogToolRegistration } from "@/orivyn/tool-registration";

export default function Home() {
  return (
    <CatalogProvider
      manifest={catalogManifest}
      initialState={initialCatalogState}
      context={{ route: "/catalog" }}
    >
      <CatalogToolRegistration />
      <CatalogWorkspace />
    </CatalogProvider>
  );
}
