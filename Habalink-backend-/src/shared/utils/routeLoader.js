import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

console.log("🔎 Route loader initialized");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loadRoutes = async (app) => {
  try {
    const featuresPath = path.join(__dirname, "../../features");

    console.log("📂 Scanning features folder...");

    const features = fs.readdirSync(featuresPath);

    for (const feature of features) {
      const featurePath = path.join(featuresPath, feature);

      // Skip if not a folder
      if (!fs.lstatSync(featurePath).isDirectory()) continue;

      const files = fs.readdirSync(featurePath);

      for (const file of files) {
        if (!file.endsWith(".routes.js")) continue;

        const routePath = path.join(featurePath, file);

        try {
          const routeModule = await import(pathToFileURL(routePath).href);

          // Skip empty route files
          if (!routeModule.default) {
            console.log(`⚠️ Skipping ${file} (no router exported)`);
            continue;
          }

          console.log(`✅ Loading route: /api/${feature}`);

          app.use(`/api/${feature}`, routeModule.default);
        } catch (err) {
          console.error(`❌ Failed to load ${file}`);
          console.error(err.message);
        }
      }
    }

    console.log("🚀 All routes loaded successfully");
  } catch (error) {
    console.error("❌ Route loader error:", error);
  }
};
