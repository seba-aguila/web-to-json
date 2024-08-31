import * as cheerio from "cheerio";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Stack } from "./stack";
import axios, { AxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractFormattedText = (html: string) => {
  const $ = cheerio.load(html);
  let simplifiedText = "";
  let detailedText = "";

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr("content");
  if (metaDescription) {
    detailedText += `meta_description: ${metaDescription}\n\n`;
    simplifiedText += `Meta Description: ${metaDescription}\n\n`;
  }

  $("body")
    .find("*")
    .each((_, element) => {
      const tag = element.name.toLowerCase();
      const $element = $(element);

      if (["script", "style", "noscript"].includes(tag)) {
        return; // Skip these tags
      }

      const text = $element.clone().children().remove().end().text().trim();
      if (text) {
        switch (tag) {
          case "h1":
            detailedText += `h1: ${text}\n\n`;
            simplifiedText += `Headline (H1): ${text}\n\n`;
            break;
          case "h2":
            detailedText += `h2: ${text}\n\n`;
            simplifiedText += `Subheadline (H2): ${text}\n\n`;
            break;
          case "h3":
            detailedText += `h3: ${text}\n\n`;
            simplifiedText += `Subheadline (H3): ${text}\n\n`;
            break;
          case "p":
            detailedText += `p: ${text}\n\n`;
            simplifiedText += `${text}\n\n`;
            break;
          case "a":
            detailedText += `link: ${text} (${$element.attr("href")})\n`;
            // Simplified text doesn't include links
            break;
          case "img":
            detailedText += `image: ${$element.attr("alt")} (${$element.attr(
              "src"
            )})\n`;
            // Simplified text doesn't include images
            break;
          case "li":
            detailedText += `- ${text}\n`;
            simplifiedText += `• ${text}\n`;
            break;
          default:
            if ($element.parents("li").length === 0) {
              detailedText += `${text}\n\n`;
              simplifiedText += `${text}\n\n`;
            }
        }
      }
    });

  return {
    simplifiedText: simplifiedText.trim(),
    detailedText: detailedText.trim(),
  };
};

export const extractTextByTag = (html: string) => {
  const $ = cheerio.load(html);
  const tagsMap = {} as any;

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr("content");
  if (metaDescription) {
    tagsMap["meta_description"] = [{ meta_description: metaDescription }];
  }

  $("*").each((_index, element) => {
    const tag = element.name.toLowerCase();
    const $element = $(element);

    if (["script", "style", "noscript", "html", "head", "body"].includes(tag)) {
      return; // Skip these tags
    }

    let text = $element.clone().children().remove().end().text().trim();

    if (text || tag === "img") {
      if (!tagsMap[tag]) {
        tagsMap[tag] = [];
      }

      const position = tagsMap[tag].length + 1;
      const key = position === 1 ? tag : `${tag}_${position}`;

      switch (tag) {
        case "a":
          tagsMap[tag].push({ [key]: `${text} (${$element.attr("href")})` });
          break;
        case "img":
          tagsMap[tag].push({
            [key]: `${$element.attr("alt")} (${$element.attr("src")})`,
          });
          break;
        default:
          tagsMap[tag].push({ [key]: text });
      }
    }
  });

  return tagsMap;
};

export const getTextFromHtml = (html: string) => {
  const tagsMap = {} as any;
  const tagsStack = new Stack();
  for (let i = 0; i < html.length; i++) {
    if (isWhitespace(html[i])) {
      continue;
    }
    if (html[i] === "<" && html[i + 1] === "/") {
      let j = i + 1;
      while (html[j] !== ">") j++;
      i = j;
      const saliendo = tagsStack.pop();
    } else if (html[i] === "<" && html[i + 1] === "!") {
      let j = i + 1;
      while (html[j] !== ">") j++;
      i = j;
    } else if (html[i] === "<") {
      let currentTag = "";
      let j = i + 1;
      while (html[j] !== " " && html[j] !== ">") {
        currentTag += html[j];
        j++;
      }
      if (html[j] === " ") {
        while (html[j] !== ">") j++;
      }
      tagsStack.push(currentTag);
      i = j;
    } else {
      let currentText = "";
      let j = i;
      while (html[j] !== "<") {
        currentText += html[j];
        j++;
      }
      i = j - 1;
      let currentTag = tagsStack.peek();
      if (currentText === "" || currentTag === "script") {
        continue;
      }

      if (!tagsMap[currentTag]) {
        tagsMap[currentTag] = [];
      }

      const position = tagsMap[currentTag].length + 1;
      const key = position === 1 ? currentTag : `${currentTag}_${position}`;
      tagsMap[currentTag].push({ [key]: currentText });
    }
  }

  return tagsMap;
};

export const generateSEOStats = (detailedText: string) => {
  const lines = detailedText.split("\n");
  let stats = {
    wordCount: 0,
    headingCount: { h1: 0, h2: 0, h3: 0 },
    paragraphCount: 0,
    linkCount: 0,
    imageCount: 0,
    hasMetaDescription: false,
  };

  lines.forEach((line) => {
    const words = line
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    stats.wordCount += words.length;

    if (line.startsWith("h1:")) stats.headingCount.h1++;
    if (line.startsWith("h2:")) stats.headingCount.h2++;
    if (line.startsWith("h3:")) stats.headingCount.h3++;
    if (line.startsWith("p:")) stats.paragraphCount++;
    if (line.startsWith("link:")) stats.linkCount++;
    if (line.startsWith("image:")) stats.imageCount++;
    if (line.startsWith("meta_description:")) stats.hasMetaDescription = true;
  });

  return stats;
};

export const analyzeWithClaude = async (text: string) => {
  const API_KEY = process.env.CLAUDE_API_KEY;
  const API_URL = "https://api.anthropic.com/v1/messages";

  const prompt = `
Analiza el siguiente contenido del sitio web para SEO y redacción publicitaria. Proporciona recomendaciones basadas en estos principios:

Escribe un Título Impactante: El título debe captar la atención del cliente, enfocarse en el valor ofrecido, resumir la oferta, enganchar a los usuarios, fluir naturalmente y contribuir al SEO. Debe incluir palabras clave relevantes.

Haz que el Texto sea Fácil de Escanear: Mantén el texto corto y crea un diseño fácilmente escaneable.

Enfócate en los Beneficios en Lugar de las Características

Incluye Pruebas Sociales

Escribe Llamados a la Acción (CTAs) Atractivos

El contenido debe ser fácil de leer en un inglés sencillo, comprensible para estudiantes de 13 a 15 años.

Para SEO, proporciona el mejor análisis y sugerencias basadas en el texto proporcionado.

Aquí está el contenido del sitio web:

${text}

Proporciona tu análisis y correcciones del texto completo:`;

  try {
    const response = await axios.post(
      API_URL,
      {
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
        },
      }
    );

    if (response.data && response.data.content && response.data.content[0]) {
      return response.data.content[0].text;
    } else {
      console.error(
        "Unexpected API response structure:",
        JSON.stringify(response.data, null, 2)
      );
      return "Error: Unexpected API response structure";
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error("Axios error details:", {
        message: axiosError.message,
        response: axiosError.response?.data,
        status: axiosError.response?.status,
        headers: axiosError.response?.headers,
      });
      return `Error calling Claude API: ${axiosError.message}. Status: ${axiosError.response?.status}`;
    } else {
      console.error("Non-Axios error:", error);
      return `Unknown error occurred: ${error}`;
    }
  }
};

const isWhitespace = (str: string) => /\s/.test(str);
