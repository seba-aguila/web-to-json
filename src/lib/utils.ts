import * as cheerio from "cheerio";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Stack } from "./stack";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const extractTextByTag = (html: string) => {
  const $ = cheerio.load(html);
  const tagsMap = {} as any;

  $('*').each((_index, element) => {
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

  console.log(tagsMap)
  return tagsMap;
}

export const getTextFromHtml = (html: string) => {
  const tagsMap = {} as any;
  const tagsStack = new Stack();
  for (let i = 0; i < html.length; i++) {
    if (isWhitespace(html[i])) {
      continue;
    }
    if (html[i] === '<' && html[i + 1] === '/') {
      let j = i + 1;
      while (html[j] !== '>') j++;
      i = j;
      const saliendo = tagsStack.pop();
    }
    else if (html[i] === '<' && html[i + 1] === '!') {
      let j = i + 1;
      while (html[j] !== '>') j++;
      i = j;
    }
    else if (html[i] === '<') {
      let currentTag = '';
      let j = i + 1;
      while (html[j] !== ' ' && html[j] !== '>') {
        currentTag += html[j];
        j++;
      }
      if (html[j] === ' ') {
        while (html[j] !== '>') j++;
      }
      tagsStack.push(currentTag);
      i = j;
    }
    else {
      let currentText = '';
      let j = i;
      while (html[j] !== '<') {
        currentText += html[j];
        j++;
      }
      i = j - 1;
      let currentTag = tagsStack.peek();
      if (currentText === '' || currentTag === 'script') {
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
}

const isWhitespace = (str: string) => /\s/.test(str);