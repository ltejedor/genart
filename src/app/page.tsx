"use client";

import { VectorGraphicsForm } from "@/components/VectorGraphicsForm";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-8 text-3xl font-bold">AI Vector Graphics Generator</h1>
        <VectorGraphicsForm />
      </div>
    </main>
  );
}