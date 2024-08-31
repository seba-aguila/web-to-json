"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import Spinner from "./Spinner";

const Form = () => {
  const { toast } = useToast();
  const [simplifiedText, setSimplifiedText] = useState<string | null>(null);
  const [jsonData, setJsonData] = useState<any>(null);
  const [seoStats, setSeoStats] = useState<any>(null);
  const [claudeAnalysis, setClaudeAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // New state for loading

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    setIsLoading(true); // Set loading to true when starting the request

    try {
      const res = await fetch(
        "/api/getJSON?" +
          new URLSearchParams({
            url: formData.get("url") as string,
          })
      );
      const data = await res.json();
      if (data.simplifiedText) {
        setSimplifiedText(data.simplifiedText);
        setJsonData(data.jsonData);
        setSeoStats(data.seoStats);
        setClaudeAnalysis(data.claudeAnalysis);
        toast({
          title: "Success!",
          description: "Content extracted and analyzed successfully.",
        });
      } else {
        throw new Error("No formatted text received");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Sorry, we couldn't extract or analyze the content from the website.",
      });
    } finally {
      setIsLoading(false); // Set loading to false when the request is complete
    }
  };

  const handleDownloadText = () => {
    if (simplifiedText) {
      const blob = new Blob([simplifiedText], { type: "text/plain" });
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Spinner /> : "Extract"}
        </Button>
      </form>

      {isLoading && (
        <div className="mt-4">
          <Spinner />
          <p className="text-center mt-2">Analyzing content...</p>
        </div>
      )}

      {simplifiedText && (
        <div className="mt-4 w-full">
          <h3 className="text-lg font-semibold">Simplified Content:</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm text-black">
            {simplifiedText}
          </pre>
          <div className="flex gap-2 mt-2">
            <Button onClick={handleDownloadText}>Download Text</Button>
            <Button onClick={handleDownloadJSON}>Download JSON</Button>
          </div>
        </div>
      )}

      {seoStats && (
        <div className="mt-4 w-full">
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

      {claudeAnalysis && (
        <div className="mt-4 w-full">
          <h3 className="text-lg font-semibold">Claude's Analysis:</h3>
          <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm text-black">
            {claudeAnalysis}
          </div>
        </div>
      )}
    </div>
  );
};

export default Form;
