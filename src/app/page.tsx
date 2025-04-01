"use client";

import { useState } from "react";
import { VectorGraphicsForm } from "@/components/VectorGraphicsForm";
import { CanvasEditor, type CanvasData } from "@/components/CanvasEditor";
import { type PatchLibrary as PatchLibraryType } from "@/components/PatchLibrary";

export default function Home() {
  const [canvasData, setCanvasData] = useState<CanvasData>({ patches: [] });
  const [parsedPatches, setParsedPatches] = useState<Array<{
    patch_id: number;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    library?: string;
    squeeze?: number;
    shear?: number;
    enhance?: number;
    order?: number;
  }>>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<PatchLibraryType>("animals");

  const handleCanvasDataChange = (data: CanvasData) => {
    setCanvasData(data);
  };

  const handlePatchesVisualize = (patches: Array<{
    patch_id: number;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
    library?: string;
    squeeze?: number;
    shear?: number;
    enhance?: number;
    order?: number;
  }>) => {
    setParsedPatches(patches);
  };

  const handleLibraryChange = (library: PatchLibraryType) => {
    setSelectedLibrary(library);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center">

        <div className="mb-8 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Form Controls */}
          <div className="lg:col-span-3">
            <div className="mosaic-card p-4">
              <VectorGraphicsForm
                canvasData={canvasData}
                onPatchesVisualize={handlePatchesVisualize}
                selectedLibrary={selectedLibrary}
                onLibraryChange={handleLibraryChange}
              />
            </div>
          </div>

          {/* Middle Column - Canvas and Patch Library */}
          <div className="lg:col-span-5">
            <CanvasEditor
              onCanvasDataChange={handleCanvasDataChange}
              parsedPatches={parsedPatches}
              selectedLibrary={selectedLibrary}
              onLibraryChange={handleLibraryChange}
            />
          </div>

          {/* Right Column - Results Display */}
          <div className="lg:col-span-4">
            <div className="mosaic-card p-4">
              <h2 className="text-xl font-semibold mb-4 text-blue-600">Generated Results</h2>
              <div id="results-container">
                {/* Results will be displayed here by the VectorGraphicsForm component */}
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Mechifact. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
