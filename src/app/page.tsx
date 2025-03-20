"use client";

import { useState } from "react";
import { VectorGraphicsForm } from "@/components/VectorGraphicsForm";
import { CanvasEditor, type CanvasData } from "@/components/CanvasEditor";

export default function Home() {
  const [canvasData, setCanvasData] = useState<CanvasData>({ patches: [] });
  const [parsedPatches, setParsedPatches] = useState<Array<{
    patch_id: number;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
  }>>([]);

  const handleCanvasDataChange = (data: CanvasData) => {
    setCanvasData(data);
  };

  const handlePatchesVisualize = (patches: Array<{
    patch_id: number;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
  }>) => {
    setParsedPatches(patches);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-8 text-3xl font-bold">AI Vector Graphics Generator</h1>
        
        <div className="mb-8 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <CanvasEditor 
              onCanvasDataChange={handleCanvasDataChange} 
              parsedPatches={parsedPatches}
            />
          </div>
          
          <div>
            <VectorGraphicsForm 
              canvasData={canvasData} 
              onPatchesVisualize={handlePatchesVisualize}
            />
          </div>
        </div>
      </div>
    </main>
  );
}