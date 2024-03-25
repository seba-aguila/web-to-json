"use client"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { FormEvent } from "react"
import { useToast } from "@/components/ui/use-toast"

const Form = () => {
  const { toast } = useToast();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target;
    // @ts-ignore
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/getJSON?" + new URLSearchParams({
        url: formData.get("url") as string
      }));
      const data = await res.json();
      console.log(data);
      toast({
        title: "Success!",
        description: "Check the console to see the JSON object.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Sorry, we couldn't get the JSON from the website.",
      })
    }
  }

  return (
    <form
      className="flex gap-2 mt-2 "
      onSubmit={handleSubmit}
    >
      <Input
        placeholder="Enter the URL of your website"
        className="w-full"
        name="url"
        type="url"
      />
      <Button>
        Download
      </Button>
    </form>
  )
}

export default Form