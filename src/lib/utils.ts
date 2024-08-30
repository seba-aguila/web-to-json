import * as cheerio from "cheerio";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Stack } from "./stack";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const extractFormattedText = (html: string) => {
  const $ = cheerio.load(html);
  let formattedText = "";

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr("content");
  if (metaDescription) {
    formattedText += `meta_description: ${metaDescription}\n\n`;
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
      if (text || tag === "img") {
        switch (tag) {
          case "h1":
            formattedText += `h1: ${text}\n\n`;
            break;
          case "h2":
            formattedText += `h2: ${text}\n\n`;
            break;
          case "h3":
            formattedText += `h3: ${text}\n\n`;
            break;
          case "p":
            formattedText += `p: ${text}\n\n`;
            break;
          case "a":
            formattedText += `link: ${text} (${$element.attr("href")})\n`;
            break;
          case "img":
            formattedText += `image: ${$element.attr("alt")} (${$element.attr(
              "src"
            )})\n`;
            break;
          case "li":
            formattedText += `- ${text}\n`;
            break;
          default:
            if ($element.parents("li").length === 0) {
              formattedText += `${text}\n\n`;
            }
        }
      }
    });

  return formattedText.trim();
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

export const generateSEOStats = (formattedText: string) => {
  const lines = formattedText.split("\n");
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

const isWhitespace = (str: string) => /\s/.test(str);
