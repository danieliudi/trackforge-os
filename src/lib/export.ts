import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/constants/themes";

/**
 * A caixa CSS capturada é 1080x1350; `pixelRatio: 2` faz o bitmap sair em
 * 2160x2700. O PDF continua com página de 1080x1350, então a imagem 2x entra
 * como densidade dobrada em vez de página maior.
 */
const PIXEL_RATIO = 2;

const pngOptions = {
  width: SLIDE_WIDTH,
  height: SLIDE_HEIGHT,
  pixelRatio: PIXEL_RATIO,
  cacheBust: true,
};

/**
 * O html-to-image costuma perder webfonts na primeira renderização, porque as
 * fontes ainda não foram embutidas no clone. Um render descartado aquece o
 * cache — em 1x, já que o objetivo é só carregar as fontes.
 */
/**
 * Uma <img> ainda não decodificada sai em branco na captura. Espera todas antes
 * de rasterizar; falha individual (CORS, 404) não pode travar o export inteiro.
 */
async function waitForImages(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      try {
        await image.decode();
      } catch {
        // segue sem essa imagem
      }
    }),
  );
}

async function renderAll(nodes: HTMLElement[]) {
  await Promise.all(nodes.map(waitForImages));
  await toPng(nodes[0], { ...pngOptions, pixelRatio: 1 });

  const images: string[] = [];
  for (const node of nodes) {
    images.push(await toPng(node, pngOptions));
  }
  return images;
}

const fileName = (index: number) => `slide-${String(index + 1).padStart(2, "0")}.png`;

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

async function buildPDF(nodes: HTMLElement[]) {
  const images = await renderAll(nodes);
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [SLIDE_WIDTH, SLIDE_HEIGHT],
    compress: true,
  });

  images.forEach((image, index) => {
    if (index > 0) {
      doc.addPage([SLIDE_WIDTH, SLIDE_HEIGHT], "portrait");
    }
    doc.addImage(image, "PNG", 0, 0, SLIDE_WIDTH, SLIDE_HEIGHT);
  });

  return doc;
}

/** PDF multi-página em 1080x1350, pronto para post de documento no LinkedIn. */
export async function exportToPDF(nodes: HTMLElement[], name = "carrossel") {
  const doc = await buildPDF(nodes);
  doc.save(`${name}.pdf`);
}

/** Mesmo PDF do export, como File — usado pelo botão de compartilhar. */
export async function getPDFFile(nodes: HTMLElement[], name = "carrossel") {
  const doc = await buildPDF(nodes);
  const blob = doc.output("blob");
  return new File([blob], `${name}.pdf`, { type: "application/pdf" });
}

/** ZIP com um PNG numerado por slide (slide-01.png, slide-02.png, ...). */
export async function exportToZip(nodes: HTMLElement[], name = "carrossel") {
  const images = await renderAll(nodes);
  const zip = new JSZip();

  images.forEach((image, index) => {
    zip.file(fileName(index), image.split(",")[1], { base64: true });
  });

  downloadBlob(await zip.generateAsync({ type: "blob" }), `${name}.zip`);
}
