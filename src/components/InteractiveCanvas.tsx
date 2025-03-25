"use client";

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Line, Text, Image as KonvaImage, Group } from "react-konva";
import type { Patch } from "./PatchLibrary";
import toast from "react-hot-toast";

// Define the type for a placed patch on the canvas
export type PlacedPatch = {
  id: string;
  patchId: string;
  src: string;
  x: number;
  y: number;
  isDragging: boolean;
  rotation?: number;
  scale?: number;
};

type InteractiveCanvasProps = {
  onPatchesChange: (patches: PlacedPatch[]) => void;
  parsedPatches?: Array<{
    patch_id: number;
    img_index: number;
    x: number;
    y: number;
    rotation?: number;
    scale?: number;
  }>;
};

export function InteractiveCanvas({ onPatchesChange, parsedPatches }: InteractiveCanvasProps) {
  const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
  const [placedPatches, setPlacedPatches] = useState<PlacedPatch[]>([]);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle window resize to make the canvas responsive
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Make height proportional but with a minimum
        const height = Math.max(width, 400);
        setStageSize({ width, height });
      }
    };

    // Initial size
    updateSize();

    // Update on resize
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // Notify parent component when patches change
  useEffect(() => {
    onPatchesChange(placedPatches);
  }, [placedPatches, onPatchesChange]);

  // Handle parsed patches from API response
  useEffect(() => {
    if (!parsedPatches || parsedPatches.length === 0) return;

    // Clear existing patches if needed
    // setPlacedPatches([]);

    // Process each parsed patch
    const patchesToAdd = parsedPatches.map(patch => {
      // Convert patch_id to the corresponding image path
      const patchId = String(patch.patch_id);
      const src = `/animals/image_${patch.img_index}.png`;

      // Create a new placed patch with the parsed data
      return {
        id: `api-placed-${patchId}-${Date.now()}`,
        patchId: patchId,
        src: src,
        x: patch.x, // Already in -1 to 1 coordinate system
        y: patch.y, // Already in -1 to 1 coordinate system
        isDragging: false,
        rotation: patch.rotation || 0,
        scale: patch.scale || 1
      };
    });

    // Load images for the patches
    patchesToAdd.forEach(patch => {
      if (!images[patch.src]) {
        const img = new window.Image();
        img.src = patch.src;
        img.onload = () => {
          setImages(prev => ({ ...prev, [patch.src]: img }));
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${patch.src}`);
        };
      }
    });

    // Add the new patches to the canvas
    setPlacedPatches(prev => [...patchesToAdd]);
  }, [parsedPatches]);

  // Convert canvas coordinates to the -1 to 1 coordinate system
  const canvasToCoord = (pos: number, size: number, isYAxis: boolean = false): number => {
    // Map from canvas position (0 to size) to -1 to 1 coordinate system
    // For both axes, we need to flip the coordinates
    const normalizedPos = (pos / size) * 2; // Convert to 0-2 range
    return -1 * (normalizedPos - 1); // Convert to -1 to 1 range and flip
  };

  // Convert -1 to 1 coordinates to canvas coordinates
  const coordToCanvas = (coord: number, size: number, isYAxis: boolean = false): number => {
    // Map from -1 to 1 coordinate system to canvas position (0 to size)
    // For both axes, we need to flip the coordinates
    const flippedCoord = -1 * coord; // Flip the coordinate
    return ((flippedCoord + 1) / 2) * size; // Convert to 0-size range
  };

  // Add a new patch to the canvas
  const addPatch = (patch: Patch, x: number, y: number) => {
    // Load the image if not already loaded
    if (!images[patch.src]) {
      const img = new window.Image();
      img.src = patch.src;
      img.onload = () => {
        setImages(prev => ({ ...prev, [patch.src]: img }));
      };
    }

    // Create a new placed patch
    const newPatch: PlacedPatch = {
      id: `placed-${patch.id}-${Date.now()}`,
      patchId: patch.id,
      src: patch.src,
      x: canvasToCoord(x, stageSize.width, false),
      y: canvasToCoord(y, stageSize.height, true),
      isDragging: false,
    };

    setPlacedPatches(prev => [...prev, newPatch]);
    toast.success(`Added ${patch.name} to canvas`);
  };

  // Handle drag start for a patch
  const handleDragStart = (id: string) => {
    setPlacedPatches(prev =>
      prev.map(p => ({
        ...p,
        isDragging: p.id === id,
      }))
    );
  };

  // Handle drag end for a patch
  const handleDragEnd = (id: string, x: number, y: number) => {
    setPlacedPatches(prev =>
      prev.map(p => {
        if (p.id !== id) return p;

        // Convert canvas position to -1 to 1 coordinates
        const coordX = canvasToCoord(x, stageSize.width, false);
        const coordY = canvasToCoord(y, stageSize.height, true);

        // Clamp coordinates to stay within -1 to 1 range
        const clampedX = Math.max(-1, Math.min(1, coordX));
        const clampedY = Math.max(-1, Math.min(1, coordY));

        return {
          ...p,
          x: clampedX,
          y: clampedY,
          isDragging: false,
        };
      })
    );
  };

  // Handle dropping a patch from the library onto the canvas
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Get the drop position relative to the stage
    const stageContainer = stageRef.current?.container();
    if (!stageContainer) return;

    const stageRect = stageContainer.getBoundingClientRect();
    const x = e.clientX - stageRect.left;
    const y = e.clientY - stageRect.top;

    // Get the patch data from the drag event
    try {
      const patchData = JSON.parse(e.dataTransfer.getData("application/json")) as Patch;
      addPatch(patchData, x, y);
    } catch (error) {
      console.error("Error parsing dropped patch data:", error);
    }
  };

  // Handle drag over to allow dropping
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Remove a patch from the canvas
  const removePatch = (id: string) => {
    setPlacedPatches(prev => prev.filter(p => p.id !== id));
    toast.success("Patch removed from canvas");
  };

  return (
    <div className="w-full space-y-4">
      <h3 className="text-lg font-medium">Canvas</h3>

      <div
        ref={containerRef}
        className="relative rounded-md border border-gray-300 bg-white"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
        >
          <Layer>
            {/* Background */}
            <Rect
              x={0}
              y={0}
              width={stageSize.width}
              height={stageSize.height}
              fill="#f9fafb"
            />

            {/* Grid lines */}
            <Line
              points={[stageSize.width / 2, 0, stageSize.width / 2, stageSize.height]}
              stroke="#e5e7eb"
              strokeWidth={1}
            />
            <Line
              points={[0, stageSize.height / 2, stageSize.width, stageSize.height / 2]}
              stroke="#e5e7eb"
              strokeWidth={1}
            />

            {/* Coordinate labels */}
            <Text
              x={stageSize.width - 20}
              y={stageSize.height / 2 + 5}
              text="1"
              fontSize={12}
              fill="#6b7280"
            />
            <Text
              x={5}
              y={stageSize.height / 2 + 5}
              text="-1"
              fontSize={12}
              fill="#6b7280"
            />
            <Text
              x={stageSize.width / 2 + 5}
              y={5}
              text="-1"
              fontSize={12}
              fill="#6b7280"
            />
            <Text
              x={stageSize.width / 2 + 5}
              y={stageSize.height - 20}
              text="1"
              fontSize={12}
              fill="#6b7280"
            />

            {/* Placed patches */}
            {placedPatches.map((patch) => {
              const img = images[patch.src];
              if (!img) return null;

              // Convert -1 to 1 coordinates to canvas coordinates
              const x = coordToCanvas(patch.x, stageSize.width, false);
              const y = coordToCanvas(patch.y, stageSize.height, true);

              // Calculate image size (scaled down to fit nicely on canvas)
              const maxSize = Math.min(stageSize.width, stageSize.height) / 5;
              const scale = Math.min(maxSize / img.width, maxSize / img.height);

              return (
                <Group
                  key={patch.id}
                  x={x}
                  y={y}
                  draggable
                  rotation={patch.rotation ? -patch.rotation : 0} // Negate rotation to account for flipped coordinates
                  onDragStart={() => handleDragStart(patch.id)}
                  onDragEnd={(e) => handleDragEnd(patch.id, e.target.x(), e.target.y())}
                  onClick={() => removePatch(patch.id)}
                  onTap={() => removePatch(patch.id)}
                >
                  <KonvaImage
                    image={img}
                    width={img.width * scale * (patch.scale || 1)}
                    height={img.height * scale * (patch.scale || 1)}
                    offsetX={img.width * scale * (patch.scale || 1) / 2}
                    offsetY={img.height * scale * (patch.scale || 1) / 2}
                    opacity={patch.isDragging ? 0.7 : 1}
                    shadowColor="black"
                    shadowBlur={patch.isDragging ? 10 : 0}
                    shadowOpacity={patch.isDragging ? 0.3 : 0}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>

        <div className="absolute bottom-2 right-2">
          <button
            onClick={() => setPlacedPatches([])}
            className="rounded-md bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200"
          >
            Clear Canvas
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Click on a patch to remove it. Drag patches to reposition them.
      </p>
    </div>
  );
}
