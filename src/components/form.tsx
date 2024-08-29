"use client";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FormEvent, useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Form = () => {
  const { toast } = useToast();
  const [formattedText, setFormattedText] = useState<string | null>(null);

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
        toast({
          title: "Success!",
          description: "Text extracted successfully. You can now download it.",
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

  const handleDownload = () => {
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
          <Button onClick={handleDownload} className="mt-2">
            Download Text
          </Button>
        </div>
      )}
    </div>
  );
};

export default Form;
