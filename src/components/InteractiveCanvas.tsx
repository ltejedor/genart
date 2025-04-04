"use client";

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Line, Text, Image as KonvaImage, Group } from "react-konva";
import Konva from "konva";
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
  library?: string;
  squeeze?: number;
  shear?: number;
  red?: number;
  green?: number;
  blue?: number;
  alpha?: number;
  order?: number;
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
    library?: string;
    squeeze?: number;
    shear?: number;
    red?: number;
    green?: number;
    blue?: number;
    alpha?: number;
    order?: number;
  }>;
  onPatchSelect?: (patch: PlacedPatch | null) => void;
  onPatchUpdate?: (patch: PlacedPatch) => void;
  placedPatchesFromProps?: PlacedPatch[];
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
};

export function InteractiveCanvas({
  onPatchesChange,
  parsedPatches,
  onPatchSelect,
  onPatchUpdate,
  placedPatchesFromProps,
  backgroundColor = "#000000",
  onBackgroundColorChange
}: InteractiveCanvasProps) {
  const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
  const [placedPatches, setPlacedPatches] = useState<PlacedPatch[]>([]);
  const [selectedPatchId, setSelectedPatchId] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({});
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalUpdate = useRef(false);
  const imageRefs = useRef<Record<string, Konva.Image>>({});

  // Handle window resize to make the canvas responsive
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        // Get the container width
        const containerWidth = containerRef.current.offsetWidth;
        // Set both width and height to the same value to create a square
        // Use a minimum size to ensure visibility
        const size = Math.max(containerWidth, 350);
        setStageSize({ width: size, height: size });
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
    // Only notify parent if this was an internal update (not from props)
    if (internalUpdate.current) {
      onPatchesChange(placedPatches);
      internalUpdate.current = false;
    }
  }, [placedPatches, onPatchesChange]);

  // Notify parent component when selected patch changes
  useEffect(() => {
    if (onPatchSelect) {
      const selectedPatch = placedPatches.find(p => p.id === selectedPatchId) || null;
      onPatchSelect(selectedPatch);
    }
  }, [selectedPatchId, placedPatches, onPatchSelect]);

  // Handle parsed patches from API response
  useEffect(() => {
    if (!parsedPatches || parsedPatches.length === 0) return;

    // Process each parsed patch
    const patchesToAdd = parsedPatches.map(patch => {
      // Convert patch_id to the corresponding image path
      const patchId = String(patch.patch_id);
      // Use the library from the patch data if available, otherwise default to animals
      const library = patch.library || "animals";
      const src = `/patches/${library}/image_${patch.img_index}.png`;

      // Create a new placed patch with the parsed data
      return {
        id: `api-placed-${patchId}-${Date.now()}`,
        patchId: patchId,
        src: src,
        x: patch.x, // Already in -1 to 1 coordinate system
        y: patch.y, // Already in -1 to 1 coordinate system
        isDragging: false,
        rotation: ((patch.rotation! * 55.6635311) % 360),
        scale: patch.scale,
        library: library,
        squeeze: patch.squeeze * 0.064294401,
        shear: patch.shear * 0.939783266,
        red: patch.red * 256,
        green: patch.green * 256,
        blue: patch.blue * 256,
        alpha: patch.alpha || .3,
        order: patch.order
      };
    });

    // Sort patches by order if available
    const sortedPatches = [...patchesToAdd].sort((a, b) => {
      // If both have order, sort by order
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // If only one has order, put the one with order first
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      // If neither has order, keep original order
      return 0;
    });

    // Load images for the patches
    sortedPatches.forEach(patch => {
      if (!images[patch.src]) {
        const img = new window.Image();
        img.src = patch.src;
        img.onload = () => {
          setImages(prev => ({ ...prev, [patch.src]: img }));
          // Cache the image after it's loaded and added to the canvas
          setTimeout(() => {
            const imageNode = imageRefs.current[patch.id];
            if (imageNode) {
              imageNode.cache();
            }
          }, 50);
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${patch.src}`);
        };
      }
    });

    // Set the patches directly without triggering the other useEffect
    setPlacedPatches(sortedPatches);
    // Manually notify parent since we're bypassing the internal update flag
    onPatchesChange(sortedPatches);
  }, [parsedPatches]);

  // Handle updates from PropertyEditor via placedPatchesFromProps
  useEffect(() => {
    if (!placedPatchesFromProps) return;

    // Check if the patches have actually changed to avoid infinite loops
    const currentPatchesJson = JSON.stringify(placedPatches);
    const newPatchesJson = JSON.stringify(placedPatchesFromProps);

    if (currentPatchesJson !== newPatchesJson) {
      console.log("Updating patches from props:", placedPatchesFromProps);
      setPlacedPatches(placedPatchesFromProps);

      // If a patch is selected, update the selected patch ID
      if (selectedPatchId) {
        const selectedPatch = placedPatchesFromProps.find(p => p.id === selectedPatchId);
        if (!selectedPatch) {
          // If the selected patch was removed, clear the selection
          setSelectedPatchId(null);
        }
      }
    }
  }, [placedPatchesFromProps]);

  // Load images for all patches
  useEffect(() => {
    placedPatches.forEach(patch => {
      if (!images[patch.src]) {
        const img = new window.Image();
        img.src = patch.src;
        img.onload = () => {
          setImages(prev => ({ ...prev, [patch.src]: img }));
          // Cache the image after it's loaded and added to the canvas
          setTimeout(() => {
            const imageNode = imageRefs.current[patch.id];
            if (imageNode) {
              imageNode.cache();
            }
          }, 50);
        };
        img.onerror = () => {
          console.error(`Failed to load image: ${patch.src}`);
        };
      }
    });
  }, [placedPatches, images]);

  // Handle keyboard events for deleting selected patch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedPatchId) {
        removePatch(selectedPatchId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPatchId]);

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
      library: patch.library,
      alpha: 0.2, // Set default transparency to 0.2
    };

    internalUpdate.current = true;
    setPlacedPatches(prev => [...prev, newPatch]);
    toast.success(`Added ${patch.name} to canvas`);
  };

  // Handle drag start for a patch
  const handleDragStart = (id: string) => {
    internalUpdate.current = true;
    setPlacedPatches(prev =>
      prev.map(p => ({
        ...p,
        isDragging: p.id === id,
      }))
    );
  };

  // Handle drag end for a patch
  const handleDragEnd = (id: string, x: number, y: number) => {
    internalUpdate.current = true;
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

  // Select a patch
  const handlePatchSelect = (id: string) => {
    // If the patch is already selected, deselect it
    if (selectedPatchId === id) {
      setSelectedPatchId(null);
    } else {
      setSelectedPatchId(id);
    }
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
    internalUpdate.current = true;
    setPlacedPatches(prev => prev.filter(p => p.id !== id));
    if (selectedPatchId === id) {
      setSelectedPatchId(null);
    }
    toast.success("Patch removed from canvas");
  };

  return (
    <div className="w-full space-y-4">

      <div
        ref={containerRef}
        className="relative rounded-md border border-gray-300 bg-white flex justify-center"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div className="relative" style={{ aspectRatio: '1/1', width: '100%', maxWidth: `${stageSize.width}px` }}>
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            onClick={(e) => {
              // Deselect when clicking on empty canvas area
              if (e.target === e.currentTarget) {
                setSelectedPatchId(null);
              }
            }}
          >
            <Layer>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={stageSize.width}
                height={stageSize.height}
                fill={backgroundColor}
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

              {/* Informational text when no patches are placed */}
              {placedPatches.length === 0 && (
                <Group>
                  <Text
                    x={stageSize.width / 2 - 190}
                    y={stageSize.height / 2 - 40}
                    width={380}
                    text="Place patches on canvas, or they'll be placed randomly when generation begins."
                    fontSize={14}
                    fontStyle="normal"
                    fill="#4B5563"
                    align="center"
                    wrap="word"
                  />
                </Group>
              )}

              {/* Placed patches */}
              {placedPatches.map((patch) => {
                const img = images[patch.src];
                if (!img) return null;

                // Convert -1 to 1 coordinates to canvas coordinates
                const x = coordToCanvas(patch.x, stageSize.width, false);
                const y = coordToCanvas(patch.y, stageSize.height, true);

                // Calculate image size (scaled down to fit nicely on canvas)
                //const maxSize = Math.min(stageSize.width, stageSize.height) / 5;
                //const scale = Math.min(maxSize / img.width, maxSize / img.height);
                const scale = .25

                // Create a transform object for squeeze and shear
                const scaleX = (patch.squeeze !== undefined) ? 1 - patch.squeeze : 1;
                const scaleY = (patch.squeeze !== undefined) ? 1 + patch.squeeze : 1;
                const skewX = (patch.shear !== undefined) ? patch.shear : 0;

                return (
                  <Group
                    key={`${patch.id}-${patch.x}-${patch.y}-${patch.rotation}-${patch.scale}-${patch.squeeze}-${patch.shear}-${patch.red}-${patch.green}-${patch.blue}-${patch.alpha}`}
                    x={x}
                    y={y}
                    draggable
                    rotation={patch.rotation ? -patch.rotation : 0} // Negate rotation to account for flipped coordinates
                    scaleX={scaleX * (patch.scale || 1)}
                    scaleY={scaleY * (patch.scale || 1)}
                    skewX={skewX}
                    onDragStart={() => handleDragStart(patch.id)}
                    onDragEnd={(e) => handleDragEnd(patch.id, e.target.x(), e.target.y())}
                    onClick={() => handlePatchSelect(patch.id)}
                    onTap={() => handlePatchSelect(patch.id)}
                    opacity={selectedPatchId === patch.id ? 1 : 0.75}
                    stroke={selectedPatchId === patch.id ? "#ff0084" : undefined}
                    strokeWidth={selectedPatchId === patch.id ? 2 : 0}
                  >
                    <KonvaImage
                      ref={(node) => {
                        if (node) {
                          imageRefs.current[patch.id] = node;
                          node.cache();
                        }
                      }}
                      image={img}
                      width={img.width * scale}
                      height={img.height * scale}
                      offsetX={img.width * scale / 2}
                      offsetY={img.height * scale / 2}
                      opacity={patch.isDragging ? 0.7 : 0.75} // Default opacity 0.75
                      shadowColor="black"
                      shadowBlur={patch.isDragging ? 10 : 0}
                      shadowOpacity={patch.isDragging ? 0.3 : 0}
                      filters={[Konva.Filters.RGBA]}
                      red={patch.red !== undefined ? patch.red : 0}
                      green={patch.green !== undefined ? patch.green : 0}
                      blue={patch.blue !== undefined ? patch.blue : 0}
                      alpha={patch.alpha !== undefined ? patch.alpha : 0}
                    />
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>

        <div className="absolute bottom-2 right-2 flex space-x-2">
          {selectedPatchId && (
            <button
              onClick={() => removePatch(selectedPatchId)}
              className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
            >
              Remove Selected
            </button>
          )}
          <button
            onClick={() => {
              internalUpdate.current = true;
              setPlacedPatches([]);
              setSelectedPatchId(null);
            }}
            className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
          >
            Clear Canvas
          </button>
        </div>
      </div>
    </div>
  );
}