"use client";

import { useState } from "react";
import { PatchLibrary, type Patch } from "./PatchLibrary";
import { InteractiveCanvas, type PlacedPatch } from "./InteractiveCanvas";

export type CanvasData = {
  patches: PlacedPatch[];
};

type CanvasEditorProps = {
  onCanvasDataChange: (data: CanvasData) => void;
};

export function CanvasEditor({ onCanvasDataChange }: CanvasEditorProps) {
  const [placedPatches, setPlacedPatches] = useState<PlacedPatch[]>([]);
  
  // Handle patch selection from the library
  const handlePatchSelect = (patch: Patch) => {
    // When a patch is selected from the library, we'll add it to the center of the canvas
    const newPatch: PlacedPatch = {
      id: `placed-${patch.id}-${Date.now()}`,
      patchId: patch.id,
      src: patch.src,
      x: 0, // Center of canvas in our -1 to 1 coordinate system
      y: 0, // Center of canvas in our -1 to 1 coordinate system
      isDragging: false,
    };
    
    const updatedPatches = [...placedPatches, newPatch];
    setPlacedPatches(updatedPatches);
    onCanvasDataChange({ patches: updatedPatches });
  };
  
  // Handle patches change from the canvas
  const handlePatchesChange = (patches: PlacedPatch[]) => {
    setPlacedPatches(patches);
    onCanvasDataChange({ patches });
  };
  
  return (
    <div className="space-y-6 w-full max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Interactive Canvas</h2>
        <p className="mt-2 text-sm text-gray-600">
          Place and arrange patches on the canvas to include in your vector graphics generation
        </p>
      </div>
      
      <InteractiveCanvas onPatchesChange={handlePatchesChange} />
      
      <PatchLibrary onPatchSelect={handlePatchSelect} />
    </div>
  );
}
