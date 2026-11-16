"use client";

import { CatalogWorkspace } from "@/components/catalog-workspace";
import { CatalogProvider } from "@/orivyn/hooks";
import { initialCatalogState } from "@/orivyn/manifest";
import { CatalogToolRegistration } from "@/orivyn/tool-registration";

export default function Home() {
  return (
    <CatalogProvider initialState={initialCatalogState} context={{ route: "/catalog" }}>
      <CatalogToolRegistration />
      <CatalogWorkspace />
    </CatalogProvider>
  );
}
