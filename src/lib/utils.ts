import * as cheerio from "cheerio";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractTextByTag = (html: string) => {
  const $ = cheerio.load(html);
  const tagsMap = {} as any;

  $('*').each((index, element) => {
    // @ts-ignore
    const tag = element.tagName.toLowerCase();
    const text = $(element).text().trim();

    if (text !== "" && tag !== "script" && tag != "html") {
      if (!tagsMap[tag]) {
        tagsMap[tag] = [];
      }

      const position = tagsMap[tag].length + 1;
      const key = position === 1 ? tag : `${tag}_${position}`;
      tagsMap[tag].push({ [key]: text });
    };
  });

  return tagsMap;
}