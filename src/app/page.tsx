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
  const [backgroundColor, setBackgroundColor] = useState<string>("#000000");

  const handleCanvasDataChange = (data: CanvasData) => {
    setCanvasData(data);
  };

  const handleBackgroundColorChange = (color: string) => {
    setBackgroundColor(color);
    // Update canvasData with the new background color
    setCanvasData(prev => ({ ...prev, backgroundColor: color }));
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
              
              {/* Background Color Picker */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium mb-3">Canvas Background</h3>
                <div className="flex items-center space-x-3">
                  <label htmlFor="bg-color" className="text-sm text-gray-700">
                    Color:
                  </label>
                  <input
                    id="bg-color"
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-500">{backgroundColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Canvas and Patch Library */}
          <div className="lg:col-span-5">
            <CanvasEditor
              onCanvasDataChange={handleCanvasDataChange}
              parsedPatches={parsedPatches}
              selectedLibrary={selectedLibrary}
              onLibraryChange={handleLibraryChange}
              backgroundColor={backgroundColor}
              onBackgroundColorChange={handleBackgroundColorChange}
            />
          </div>

          {/* Right Column - Results Display */}
          <div className="lg:col-span-4">
            <div className="mosaic-card p-4">
              <h2 className="text-xl font-semibold mb-4">Generated Results</h2>
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