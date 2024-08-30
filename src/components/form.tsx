"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { generateSEOStats } from "@/lib/utils";

const Form = () => {
  const { toast } = useToast();
  const [formattedText, setFormattedText] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [seoStats, setSeoStats] = useState<any>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      const res = await fetch(
        "/api/getJSON?" +
          new URLSearchParams({
            url: formData.get("url") as string,
          })
      );
      const data = await res.json();
      if (data.formattedText) {
        setFormattedText(data.formattedText);
        setJsonData(data); // Store the entire JSON response
        const stats = generateSEOStats(data.formattedText);
        setSeoStats(stats);
        toast({
          title: "Success!",
          description:
            "Text extracted successfully. You can now analyze and download it.",
        });
      } else {
        throw new Error("No formatted text received");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Sorry, we couldn't extract the text from the website.",
      });
    }
  };

  const handleDownloadText = () => {
    if (formattedText) {
      const blob = new Blob([formattedText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "extracted_text.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadJSON = () => {
    if (jsonData) {
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "extracted_data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <form className="flex gap-2 mt-2 w-full" onSubmit={handleSubmit}>
        <Input
          placeholder="Enter the URL of your website"
          className="w-full"
          name="url"
          type="url"
        />
        <Button type="submit">Extract</Button>
      </form>
      {formattedText && (
        <div className="mt-4 w-full">
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm text-black">
            {formattedText}
          </pre>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleDownloadText}>Download Text</Button>
            <Button onClick={handleDownloadJSON}>Download JSON</Button>
          </div>
          {seoStats && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">SEO Stats:</h3>
              <ul className="list-disc pl-5">
                <li>Word Count: {seoStats.wordCount}</li>
                <li>
                  Headings: H1 ({seoStats.headingCount.h1}), H2 (
                  {seoStats.headingCount.h2}), H3 ({seoStats.headingCount.h3})
                </li>
                <li>Paragraphs: {seoStats.paragraphCount}</li>
                <li>Links: {seoStats.linkCount}</li>
                <li>Images: {seoStats.imageCount}</li>
                <li>
                  Meta Description: {seoStats.hasMetaDescription ? "Yes" : "No"}
                </li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Form;
