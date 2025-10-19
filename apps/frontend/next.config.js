import path from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const nextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
};

export default nextConfig;
