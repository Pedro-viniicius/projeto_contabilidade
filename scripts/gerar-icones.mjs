/**
 * Gera os ícones PNG do PWA a partir da marca (quadrado arredondado com
 * três barras ascendentes). Escrito à mão com zlib para não adicionar
 * dependência de imagem ao projeto.
 *
 * Uso: npm run icons
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "public", "icons");

const ACENTO = [14, 124, 102]; // #0e7c66
const CLARO = [255, 255, 255];

/** Quadrado arredondado: distância de Chebyshev suavizada nos cantos. */
function dentroDoQuadradoArredondado(x, y, tamanho, raio) {
  const dx = Math.max(raio - x, x - (tamanho - raio), 0);
  const dy = Math.max(raio - y, y - (tamanho - raio), 0);
  return dx * dx + dy * dy <= raio * raio;
}

function dentroDoRetangulo(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

function desenhar(tamanho, { margemFundo }) {
  const px = new Uint8Array(tamanho * tamanho * 4);
  const escala = tamanho / 32;
  const inicio = margemFundo * tamanho;
  const lado = tamanho - inicio * 2;
  const raio = 9 * escala;

  /* Barras da marca, nas mesmas coordenadas do SVG (viewBox 32). */
  const barras = [
    { x: 8, y: 18, w: 4, h: 7 },
    { x: 14, y: 13, w: 4, h: 12 },
    { x: 20, y: 7, w: 4, h: 18 },
  ].map((b) => ({
    x: inicio + (b.x / 32) * lado,
    y: inicio + (b.y / 32) * lado,
    w: (b.w / 32) * lado,
    h: (b.h / 32) * lado,
  }));

  for (let y = 0; y < tamanho; y++) {
    for (let x = 0; x < tamanho; x++) {
      const i = (y * tamanho + x) * 4;
      const noFundo = dentroDoQuadradoArredondado(
        x - inicio,
        y - inicio,
        lado,
        (raio * lado) / tamanho,
      );

      if (!noFundo) {
        px[i + 3] = 0; // transparente fora do quadrado
        continue;
      }

      const naBarra = barras.some((b) => dentroDoRetangulo(x, y, b));
      const cor = naBarra ? CLARO : ACENTO;
      px[i] = cor[0];
      px[i + 1] = cor[1];
      px[i + 2] = cor[2];
      px[i + 3] = 255;
    }
  }
  return px;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, "ascii"), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([tamanho, corpo, crc]);
}

function paraPng(px, tamanho) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  const linhas = Buffer.alloc(tamanho * (tamanho * 4 + 1));
  for (let y = 0; y < tamanho; y++) {
    const inicio = y * (tamanho * 4 + 1);
    linhas[inicio] = 0; // filtro "none"
    Buffer.from(px.buffer, y * tamanho * 4, tamanho * 4).copy(
      linhas,
      inicio + 1,
    );
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(linhas, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(DESTINO, { recursive: true });

const arquivos = [
  { nome: "icon-192.png", tamanho: 192, margemFundo: 0 },
  { nome: "icon-512.png", tamanho: 512, margemFundo: 0 },
  /* Maskable precisa de zona segura: a arte ocupa ~80% da tela. */
  { nome: "icon-maskable-512.png", tamanho: 512, margemFundo: 0.1 },
  { nome: "apple-touch-icon.png", tamanho: 180, margemFundo: 0 },
];

for (const { nome, tamanho, margemFundo } of arquivos) {
  const px = desenhar(tamanho, { margemFundo });
  writeFileSync(join(DESTINO, nome), paraPng(px, tamanho));
  console.log(`gerado: public/icons/${nome} (${tamanho}px)`);
}
