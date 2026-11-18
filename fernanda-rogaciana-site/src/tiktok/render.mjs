// Gera o vídeo vertical do TikTok quadro a quadro (determinístico) e junta com o áudio.
// Uso: node src/tiktok/render.mjs <saida.mp4> <pasta-temporaria> [quadro-unico-em-segundos]
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const aqui = dirname(fileURLToPath(import.meta.url));
const [saida, tmp, unico] = process.argv.slice(2);
const FPS = 30;

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1080, height: 1920 } });
await pagina.goto("file://" + join(aqui, "cena.html"));
await pagina.evaluate(() => window.pronto);
const duracao = await pagina.evaluate(() => window.DURACAO);

if (unico !== undefined) {
  await pagina.evaluate((t) => window.desenhar(t), Number(unico));
  await pagina.screenshot({ path: saida });
  await navegador.close();
  process.exit(0);
}

rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const total = duracao * FPS;
for (let i = 0; i < total; i++) {
  await pagina.evaluate((t) => window.desenhar(t), i / FPS);
  await pagina.screenshot({ path: join(tmp, `q${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
}
await navegador.close();

const wav = join(tmp, "trilha.wav");
execFileSync("python3", ["-I", join(aqui, "audio.py"), wav]);
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(tmp, "q%05d.jpg"), "-i", wav,
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium",
  "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", saida,
]);
console.log("vídeo:", saida);
