"use client";

import { VectorGraphicsForm } from "@/components/VectorGraphicsForm";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      {/* Notification Banner */}
      <div className="mb-8 rounded-lg bg-indigo-100 p-4 shadow-md border border-indigo-300">
        <div className="flex items-center">
          <div className="mr-3 flex-shrink-0">
            <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-indigo-800">Coming Soon!</p>
            <p className="text-sm text-indigo-700">
              We're working on an interactive canvas feature for the AI Vector Graphics Generator. Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-8 text-3xl font-bold">AI Vector Graphics Generator</h1>
        <VectorGraphicsForm />
      </div>
    </main>
  );
}