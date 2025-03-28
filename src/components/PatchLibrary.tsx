"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Tab } from "@headlessui/react";

// Define the available patch libraries
export type PatchLibrary = "animals" | "handwritten_mnist" | "shore_glass" | "fruit";

// Define the library metadata
export const LIBRARY_METADATA: Record<PatchLibrary, { name: string; count: number; displayName: string }> = {
  animals: { name: "animals", count: 43, displayName: "Animals" },
  handwritten_mnist: { name: "handwritten_mnist", count: 160, displayName: "Handwritten" },
  shore_glass: { name: "shore_glass", count: 48, displayName: "Shore Glass" },
  fruit: { name: "fruit", count: 18, displayName: "Fruit" },
};


// Define the patch URL pattern for API submission
export const PATCH_URL_PATTERN = "https://storage.googleapis.com/dm_arnheim_3_assets/collage_patches/";

export type Patch = {
  id: string;
  src: string;
  name: string;
  library: PatchLibrary;
};

type PatchLibraryProps = {
  onPatchSelect: (patch: Patch) => void;
  selectedLibrary?: PatchLibrary;
  onLibraryChange?: (library: PatchLibrary) => void;
};

export function PatchLibrary({ onPatchSelect, selectedLibrary, onLibraryChange }: PatchLibraryProps) {
  const [patches, setPatches] = useState<Patch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeLibrary, setActiveLibrary] = useState<PatchLibrary>(selectedLibrary || "animals");

  // Handle library tab change
  const handleLibraryChange = (library: PatchLibrary) => {
    setActiveLibrary(library);
    if (onLibraryChange) {
      onLibraryChange(library);
    }
  };

  useEffect(() => {
    // Update active library if selectedLibrary prop changes
    if (selectedLibrary && selectedLibrary !== activeLibrary) {
      setActiveLibrary(selectedLibrary);
    }
  }, [selectedLibrary, activeLibrary]);

  useEffect(() => {
    // Load patches from the selected library
    const loadPatches = async () => {
      setIsLoading(true);
      try {
        const libraryInfo = LIBRARY_METADATA[activeLibrary];

        // Create an array of patches based on the library count
        const patchesArray: Patch[] = Array.from({ length: libraryInfo.count }, (_, i) => ({
          id: `patch-${i}`,
          src: `/patches/${libraryInfo.name}/image_${i}.png`,
          name: `${libraryInfo.displayName} ${i}`,
          library: activeLibrary,
        }));

        setPatches(patchesArray);
      } catch (error) {
        console.error(`Error loading patches from ${activeLibrary}:`, error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPatches();
  }, [activeLibrary]);

  // Get the index of the active library for the Tab.Group
  const libraryKeys = Object.keys(LIBRARY_METADATA) as PatchLibrary[];
  const selectedIndex = libraryKeys.indexOf(activeLibrary);

  return (
    <div className="w-full">
      <h3 className="mb-2 text-lg font-medium">Patch Library</h3>

      <Tab.Group 
        selectedIndex={selectedIndex} 
        onChange={(index) => {
          const libraries = Object.keys(LIBRARY_METADATA) as PatchLibrary[];
          handleLibraryChange(libraries[index]);
        }}
      >
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/10 p-1 mb-3">
          {Object.entries(LIBRARY_METADATA).map(([key, library]) => (
            <Tab
              key={key}
              className={({ selected }) =>
                `w-full rounded-lg py-2 text-sm font-medium leading-5
                ${selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'}`
              }
            >
              {library.displayName}
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>

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