import Form from "@/components/form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-2 py-10">
      <h1 className="text-center text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
        Web to Text/JSON
      </h1>
      <span className="max-w-[750px] text-center text-lg text-muted-foreground sm:text-xl">
        Transform the text of any website to Text/JSON with just one click!
      </span>
      <Form />
    </main>
  );
}
