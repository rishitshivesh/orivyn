import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { syncCactusAssets } from "../../../packages/browser/scripts/sync-assets.mjs";

syncCactusAssets(join(fileURLToPath(new URL("..", import.meta.url)), "public", "vendor", "cactus"));
