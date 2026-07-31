import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "node-unrar-js";
const { createExtractorFromData } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = "C:\\Users\\admin\\AppData\\Local\\Temp\\codebuddy-dropped-files\\fb140358-c780-4e27-af38-acca9799fd5c\\china_SHP.rar";
const out = path.join(__dirname, "extracted");
fs.mkdirSync(out, { recursive: true });

const buf = fs.readFileSync(src);
const extractor = await createExtractorFromData({ data: new Uint8Array(buf) });
const { fileHeaders } = extractor.getFileList();
const res = extractor.extract({ files: fileHeaders.map((f) => f.name) });
for (const f of res.extract) {
  const fp = path.join(out, f.name);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  const data = f.data ?? f.fileData;
  fs.writeFileSync(fp, Buffer.from(data));
}
console.log("extracted:");
for (const f of res.extract) console.log("  " + f.name);
