import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist/server", { recursive: true });

for (const path of [
  "index.html",
  "news.html",
  "news.js",
  "styles.css",
  "app.js",
  "data",
  "assets",
  "vendor",
  "color-tokens.html",
  "index-tdesign.html",
  "prototype-blueprint.html"
]) {
  await cp(path, `dist/${path}`, { recursive: true });
}
try {
  await cp(".openai", "dist/.openai", { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const embeddedFiles = {
  "/": {
    type: "text/html; charset=utf-8",
    body: await readFile("index.html", "utf8")
  },
  "/index.html": {
    type: "text/html; charset=utf-8",
    body: await readFile("index.html", "utf8")
  },
  "/news.html": {
    type: "text/html; charset=utf-8",
    body: await readFile("news.html", "utf8")
  },
  "/news.js": {
    type: "text/javascript; charset=utf-8",
    body: await readFile("news.js", "utf8")
  },
  "/styles.css": {
    type: "text/css; charset=utf-8",
    body: await readFile("styles.css", "utf8")
  },
  "/app.js": {
    type: "text/javascript; charset=utf-8",
    body: await readFile("app.js", "utf8")
  },
  "/data/site-data.json": {
    type: "application/json; charset=utf-8",
    body: await readFile("data/site-data.json", "utf8")
  },
  "/assets/about-galaxy.jpg": {
    type: "image/jpeg",
    bodyBase64: (await readFile("assets/about-galaxy.jpg")).toString("base64")
  },
  "/assets/fonts/LanshanSansSC.woff2": {
    type: "font/woff2",
    bodyBase64: (await readFile("assets/fonts/LanshanSansSC.woff2")).toString("base64")
  },
  "/assets/fonts/LanshanSerifSC.woff2": {
    type: "font/woff2",
    bodyBase64: (await readFile("assets/fonts/LanshanSerifSC.woff2")).toString("base64")
  },
  "/assets/fonts/OFL.txt": {
    type: "text/plain; charset=utf-8",
    body: await readFile("assets/fonts/OFL.txt", "utf8")
  }
};

const worker = `
const files = ${JSON.stringify(embeddedFiles)};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const file = files[url.pathname] ?? (!url.pathname.includes(".") ? files["/"] : null);
    if (!file) return new Response("Not found", { status: 404 });
    const body = file.bodyBase64
      ? Uint8Array.from(atob(file.bodyBase64), character => character.charCodeAt(0))
      : file.body;
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": file.type,
        "cache-control": url.pathname === "/" || url.pathname === "/index.html"
          ? "no-cache"
          : "public, max-age=3600"
      }
    });
  }
};
`;

await writeFile("dist/server/index.js", worker);

console.log("Built static prototype into dist/");
