import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import pptxgen from "pptxgenjs";

/**
 * A caixa CSS capturada é o canvas virtual (varia por formato/plataforma);
 * `pixelRatio: 2` faz o bitmap sair no dobro. O PDF/PPTX continuam com
 * página do mesmo tamanho do canvas, então a imagem 2x entra como densidade
 * dobrada em vez de página maior.
 */
const PIXEL_RATIO = 2;

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

async function renderAll(nodes: HTMLElement[], width: number, height: number) {
  const pngOptions = { width, height, pixelRatio: PIXEL_RATIO, cacheBust: true };

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

/** PDF já tratava o canvas virtual como pt (1pt = 1px); o PPTX segue a mesma régua em polegadas. */
const PT_PER_INCH = 72;

async function buildPDF(nodes: HTMLElement[], width: number, height: number) {
  const images = await renderAll(nodes, width, height);
  const orientation = width >= height ? "landscape" : "portrait";
  const doc = new jsPDF({
    orientation,
    unit: "pt",
    format: [width, height],
    compress: true,
  });

  images.forEach((image, index) => {
    if (index > 0) {
      doc.addPage([width, height], orientation);
    }
    doc.addImage(image, "PNG", 0, 0, width, height);
  });

  return doc;
}

/** PDF multi-página no tamanho do canvas ativo, pronto para post de documento no LinkedIn. */
export async function exportToPDF(nodes: HTMLElement[], width: number, height: number, name = "carrossel") {
  const doc = await buildPDF(nodes, width, height);
  doc.save(`${name}.pdf`);
}

/** Mesmo PDF do export, como File — usado pelo botão de compartilhar. */
export async function getPDFFile(nodes: HTMLElement[], width: number, height: number, name = "carrossel") {
  const doc = await buildPDF(nodes, width, height);
  const blob = doc.output("blob");
  return new File([blob], `${name}.pdf`, { type: "application/pdf" });
}

/** ZIP com um PNG numerado por slide (slide-01.png, slide-02.png, ...). */
export async function exportToZip(nodes: HTMLElement[], width: number, height: number, name = "carrossel") {
  const images = await renderAll(nodes, width, height);
  const zip = new JSZip();

  images.forEach((image, index) => {
    zip.file(fileName(index), image.split(",")[1], { base64: true });
  });

  downloadBlob(await zip.generateAsync({ type: "blob" }), `${name}.zip`);
}

/**
 * .pptx de verdade — cada slide é a mesma imagem renderizada hoje, em página
 * de foto cheia. Não é fidelidade nativa de template (texto/formas editáveis
 * do PowerPoint): é o MVP raster, que reaproveita o pipeline de export atual
 * em vez de reimplementar o layout em XML nativo.
 */
export async function exportToPPTX(nodes: HTMLElement[], width: number, height: number, name = "apresentacao") {
  const images = await renderAll(nodes, width, height);
  const widthIn = width / PT_PER_INCH;
  const heightIn = height / PT_PER_INCH;

  const pres = new pptxgen();
  pres.defineLayout({ name: "CANVAS", width: widthIn, height: heightIn });
  pres.layout = "CANVAS";

  for (const image of images) {
    const slide = pres.addSlide();
    slide.addImage({ data: image, x: 0, y: 0, w: widthIn, h: heightIn });
  }

  await pres.writeFile({ fileName: `${name}.pptx` });
}
