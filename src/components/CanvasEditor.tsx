"use client";

import { useState, useEffect } from "react";
import { PatchLibrary, type Patch, type PatchLibrary as PatchLibraryType } from "./PatchLibrary";
import { InteractiveCanvas, type PlacedPatch } from "./InteractiveCanvas";
import toast from "react-hot-toast";

export type CanvasData = {
  patches: PlacedPatch[];
};

type CanvasEditorProps = {
  onCanvasDataChange: (data: CanvasData) => void;
  parsedPatches?: Array<{
    patch_id: number;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
  }>;
};

export function CanvasEditor({ onCanvasDataChange, parsedPatches }: CanvasEditorProps) {
  const [placedPatches, setPlacedPatches] = useState<PlacedPatch[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<PatchLibraryType>("animals");
  
  // Handle library change
  const handleLibraryChange = (library: PatchLibraryType) => {
    setSelectedLibrary(library);
  };
  
  // Handle patch selection from the library
  const handlePatchSelect = (patch: Patch) => {
    // Check if the patch is from a different library than the currently placed patches
    const shouldClearCanvas = placedPatches.length > 0 && 
      placedPatches.some(p => {
        // Extract library from the src path
        const pathParts = p.src.split('/');
        const patchLibrary = pathParts[2] as PatchLibraryType; // patches/[library]/image_x.png
        return patchLibrary !== patch.library;
      });
    
    // When a patch is selected from the library, we'll add it to the center of the canvas
    const newPatch: PlacedPatch = {
      id: `placed-${patch.id}-${Date.now()}`,
      patchId: patch.id,
      src: patch.src,
      x: 0, // Center of canvas in our -1 to 1 coordinate system
      y: 0, // Center of canvas in our -1 to 1 coordinate system
      isDragging: false,
      library: patch.library,
    };
    
    let updatedPatches: PlacedPatch[];
    
    if (shouldClearCanvas) {
      // If the patch is from a different library, clear the canvas first
      updatedPatches = [newPatch];
      // Notify the user that the canvas was cleared
      toast.info(`Canvas cleared - only patches from ${patch.library} library can be used at once`);
    } else {
      // Otherwise, add the patch to the existing patches
      updatedPatches = [...placedPatches, newPatch];
    }
    
    setPlacedPatches(updatedPatches);
    onCanvasDataChange({ patches: updatedPatches });
  };
  
  // Handle patches change from the canvas
  const handlePatchesChange = (patches: PlacedPatch[]) => {
    // Only update if the patches have actually changed
    // This prevents unnecessary re-renders and infinite loops
    if (JSON.stringify(patches) !== JSON.stringify(placedPatches)) {
      setPlacedPatches(patches);
      onCanvasDataChange({ patches });
    }
  };
  
  // Handle parsed patches from props
  useEffect(() => {
    if (parsedPatches && parsedPatches.length > 0) {
      // We don't need to do anything here as the InteractiveCanvas
      // will handle the parsed patches and call handlePatchesChange
    }
  }, [parsedPatches]);
  
  return (
    <div className="space-y-6 w-full max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">Interactive Canvas</h2>
        <p className="mt-2 text-sm text-gray-600">
          Place and arrange patches on the canvas to include in your vector graphics generation
        </p>
      </div>
      
      <InteractiveCanvas 
        onPatchesChange={handlePatchesChange} 
        parsedPatches={parsedPatches} 
      />
      
      <PatchLibrary 
        onPatchSelect={handlePatchSelect} 
        selectedLibrary={selectedLibrary}
        onLibraryChange={handleLibraryChange}
      />
    </div>
  );
}