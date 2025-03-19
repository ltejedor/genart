"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export type Patch = {
  id: string;
  src: string;
  name: string;
};

type PatchLibraryProps = {
  onPatchSelect: (patch: Patch) => void;
};

export function PatchLibrary({ onPatchSelect }: PatchLibraryProps) {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load patches from the animals directory
    const loadPatches = async () => {
      setIsLoading(true);
      try {
        // Create an array of 43 patches (based on the file list in the codebase)
        const patchesArray: Patch[] = Array.from({ length: 43 }, (_, i) => ({
          id: `patch-${i}`,
          src: `/animals/image_${i}.png`,
          name: `Animal ${i}`,
        }));
        
        setPatches(patchesArray);
      } catch (error) {
        console.error("Error loading patches:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatches();
  }, []);

  return (
    <div className="w-full">
      <h3 className="mb-2 text-lg font-medium">Patch Library</h3>
      
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <p>Loading patches...</p>
        </div>
      ) : (
        <div className="grid max-h-60 grid-cols-4 gap-2 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2 sm:grid-cols-5 md:grid-cols-6">
          {patches.map((patch) => (
            <div
              key={patch.id}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-md border border-gray-300 bg-white p-1 transition-all hover:border-indigo-500 hover:shadow-md"
              onClick={() => onPatchSelect(patch)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/json", JSON.stringify(patch));
              }}
            >
              <div className="relative h-full w-full">
                <Image
                  src={patch.src}
                  alt={patch.name}
                  fill
                  sizes="(max-width: 768px) 25vw, 10vw"
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        Drag and drop patches onto the canvas or click to select
      </p>
    </div>
  );
}
