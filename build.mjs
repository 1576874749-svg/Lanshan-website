import { cp, mkdir, rm } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });

for (const path of ["index.html", "styles.css", "app.js", "data", ".openai"]) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await cp("server/index.js", "dist/server/index.js");

console.log("Built static prototype into dist/");
