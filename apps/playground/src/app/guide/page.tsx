import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Braces,
  Code2,
  FileText,
  TerminalSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeading } from "@/components/console/page-heading";

const documents = [
  {
    name: "Application Runtime v0.5",
    description:
      "Manifests, scoped contexts, React hooks and external consumer.",
    href: "docs/APPLICATION_RUNTIME.md",
  },
  {
    name: "Local actions and benchmarks",
    description: "Reusable action SDK, model evaluation, fixtures and exports.",
    href: "docs/LOCAL_TOOLS.md",
  },
  {
    name: "Architecture",
    description: "Execution boundaries, runtime selection and threat model.",
    href: "docs/ARCHITECTURE.md",
  },
  {
    name: "Integrations",
    description:
      "Server SDK usage, app-owned authorization and tool contracts.",
    href: "docs/INTEGRATIONS.md",
  },
  {
    name: "Interface guide",
    description:
      "Console routes, existing functionality and planned capabilities.",
    href: "docs/INTERFACE.md",
  },
  {
    name: "Conversation engine",
    description: "Provider setup, streaming and routing boundaries.",
    href: "docs/CONVERSATION.md",
  },
  {
    name: "Browser inference",
    description: "Needle, Whistle, privacy and local runtime setup.",
    href: "docs/BROWSER_RUNTIME.md",
  },
  {
    name: "API reference guide",
    description: "Endpoint inventory, Scalar, examples and error behavior.",
    href: "docs/API_REFERENCE.md",
  },
  {
    name: "Deployment",
    description: "Local development, Docker, Dokploy and production gates.",
    href: "docs/DEPLOYMENT.md",
  },
  {
    name: "Engineering rules",
    description: "Modularity, linting, documentation and safety requirements.",
    href: "AGENTS.md",
  },
];

export default function Guide() {
  return (
    <>
      <PageHeading
        eyebrow="Workspace / Documentation"
        title="Build with Orivyn"
        description="Everything exposed by the foundation is documented. The API specification is generated from the backend so documentation doesn't drift from implementation."
        action={<Badge>Docs as code</Badge>}
      />
      <Card>
        <CardContent className="p-6 md:p-8">
          <div className="mb-5 flex items-center gap-2">
            <TerminalSquare className="size-5 text-[#b2b4ff]" />
            <h2 className="font-semibold">Quick start</h2>
          </div>
          <pre className="overflow-auto rounded-xl border border-white/[0.06] bg-[#090c13] p-5 font-mono text-xs leading-8 text-[#b5c0de]">{`corepack enable
pnpm install
uv sync --project apps/api --extra dev
pnpm dev:api
# new terminal
pnpm dev:web`}</pre>
          <p className="mt-5 text-xs leading-6 text-slate-500">
            The API starts with the inference provider disabled. Model-backed
            proposals require Cactus installation and private environment
            configuration.
          </p>
        </CardContent>
      </Card>
      <section className="mt-7 grid gap-3 md:grid-cols-2">
        <a
          href={`${process.env.NEXT_PUBLIC_ORIVYN_API_URL || "http://localhost:8080"}/docs`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Card className="h-full border-[#abaaff]/20 bg-[#a3a5ff]/[0.055]">
            <CardContent className="flex h-full items-start justify-between gap-4 p-6">
              <div>
                <Badge className="mb-4">Interactive API reference</Badge>
                <h3 className="text-lg font-semibold">Scalar OpenAPI</h3>
                <p className="mt-2 max-w-sm text-xs leading-6 text-slate-400">
                  Search endpoints, inspect schemas and run permitted requests.
                  Served by the FastAPI backend at /docs.
                </p>
              </div>
              <ArrowUpRight className="size-5 shrink-0 text-[#bfc0ff]" />
            </CardContent>
          </Card>
        </a>
        <a
          href={`${process.env.NEXT_PUBLIC_ORIVYN_API_URL || "http://localhost:8080"}/openapi.json`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Card className="h-full">
            <CardContent className="flex h-full items-start justify-between gap-4 p-6">
              <div>
                <Badge className="mb-4">Machine-readable specification</Badge>
                <h3 className="text-lg font-semibold">OpenAPI JSON</h3>
                <p className="mt-2 max-w-sm text-xs leading-6 text-slate-400">
                  Generated directly from FastAPI routes and Pydantic models.
                  Suitable for client generation and contract tests.
                </p>
              </div>
              <Braces className="size-5 shrink-0 text-[#afb0ff]" />
            </CardContent>
          </Card>
        </a>
      </section>
      <div className="mb-4 mt-9 flex items-center gap-2">
        <BookOpenText className="size-4 text-slate-400" />
        <h2 className="text-lg font-semibold">Documentation library</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {documents.map((doc) => (
          <a
            key={doc.href}
            href={`https://github.com/rishitshivesh/orivyn/blob/main/${doc.href}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="h-full transition-colors hover:border-[#a6a7ef]/35">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <FileText className="size-4 text-[#b1b3ff]" />
                  <ArrowUpRight className="size-3.5 text-slate-600" />
                </div>
                <h3 className="text-sm font-medium">{doc.name}</h3>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  {doc.description}
                </p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
      <div className="mt-7 flex flex-wrap gap-4 text-xs text-slate-500">
        <Code2 className="size-4" /> Public packages are workspace packages
        today; publishing will follow contract stabilization.{" "}
        <Link href="/playground" className="text-[#b9bbff] hover:text-white">
          Try the playground
        </Link>
      </div>
    </>
  );
}
