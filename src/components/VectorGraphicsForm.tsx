"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { PATCH_URL_PATTERN, type PatchLibrary as PatchLibraryType, LIBRARY_METADATA } from "./PatchLibrary";
import { jsToPythonColor } from "@/lib/coordinateUtils";

// Define the form schema using zod
const formSchema = z.object({
  mode: z.enum(["text", "image"]).default("text"),
  prompt: z.string().optional(),
  numPatches: z.number().int().min(1).max(250).default(5),
  optimSteps: z.number().int().min(1).max(15000).default(250),
  image: z.instanceof(File).optional(),
}).refine((data) => {
  // If mode is text, prompt is required
  if (data.mode === "text") {
    return !!data.prompt;
  }
  // If mode is image, image is required
  if (data.mode === "image") {
    return !!data.image;
  }
  return false;
}, {
  message: "Please provide either a text prompt or an image based on the selected mode",
  path: ["prompt"], // This will show the error on the prompt field for text mode
});

type FormValues = z.infer<typeof formSchema>;

// Define a type for the image-JSON pairs returned by the API
type ImageJsonPair = [string, string]; // [imageUrl, jsonUrl]

// Define the prediction response types
type PredictionResponse = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: Array<[string, string]> | null; // Now an array of [imageUrl, jsonUrl] pairs
  error?: string;
};

// Define the type for parsed patch data from JSON
type ParsedPatch = {
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
  order?: number;
};

type VectorGraphicsFormProps = {
  canvasData?: {
    patches: Array<{
      id: string;
      patchId: string;
      src: string;
      x: number;
      y: number;
      isDragging: boolean;
      red?: number;
      green?: number;
      blue?: number;
    }>;
  };
  onPatchesVisualize?: (patches: ParsedPatch[]) => void;
  selectedLibrary?: PatchLibraryType;
  onLibraryChange?: (library: PatchLibraryType) => void;
};

// Helper function to extract the image name from the src path
const extractImageName = (src: string): string => {
  // Extract just the filename from the path
  const filename = src.split('/').pop() || '';
  return filename;
};

// Helper function to determine the active library from canvas data
const determineActiveLibrary = (canvasData?: VectorGraphicsFormProps["canvasData"]): string => {
  if (!canvasData || !canvasData.patches || canvasData.patches.length === 0) {
    return "animals"; // Default to animals if no patches
  }

  // Extract library from the first patch's src
  const firstPatch = canvasData.patches[0];
  const pathParts = firstPatch.src.split('/');
  // The library is the second part of the path: /patches/[library]/image_x.png
  return pathParts.length >= 3 ? pathParts[2] : "animals";
};

export function VectorGraphicsForm({
  canvasData,
  onPatchesVisualize,
  selectedLibrary = "animals",
  onLibraryChange
}: VectorGraphicsFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<ImageJsonPair[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [parsedPatches, setParsedPatches] = useState<ParsedPatch[]>([]);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<"text" | "image">("text");

  const resultsContainerRef = useRef<HTMLElement | null>(null);

  // Find the results container element
  useEffect(() => {
    resultsContainerRef.current = document.getElementById('results-container');
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "text",
      prompt: "",
      numPatches: 5,
      optimSteps: 250,
    },
    mode: "onChange",
  });

  // Add a useEffect to log form errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Form validation errors:", errors);
    }
  }, [errors]);

  // Add useEffect to update numPatches when canvasData changes
  useEffect(() => {
    if (canvasData && canvasData.patches) {
      // Only update if the canvas has patches and the count is within valid range
      const patchCount = canvasData.patches.length;
      if (patchCount >= 1 && patchCount <= 250) {
        setValue("numPatches", patchCount);
      }
    }
  }, [canvasData, setValue]);

  // Watch the current mode to conditionally render form elements
  const currentMode = watch("mode");

  // Handle form submission
  const formSubmitHandler = handleSubmit(
    (data) => {
      console.log("Form submitted successfully:", data);
      onSubmit(data);
    },
    (errors) => {
      console.log("Form submission failed with errors:", errors);
      if (currentMode === "text" && !watch("prompt")) {
        toast.error("Please enter a text prompt");
      } else if (currentMode === "image" && !watch("image")) {
        toast.error("Please upload an image");
      } else {
        toast.error("Please check the form for errors");
      }
    }
  );

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      return;
    }

    // Set the file in the form
    setValue("image", file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle mode change
  const handleModeChange = (mode: "text" | "image") => {
    setValue("mode", mode);
    setSelectedMode(mode);

    // Clear the other mode's data
    if (mode === "text") {
      setValue("image", undefined);
      setImagePreview(null);
    } else {
      setValue("prompt", "");
    }
  };

  // Handle library change
  const handleLibraryChange = (library: PatchLibraryType) => {
    if (onLibraryChange) {
      onLibraryChange(library);
    }
  };

  // Function to create a prediction with error handling
  const createPrediction = async (formData: FormValues) => {
    try {
      // Use the selectedLibrary prop instead of determining from canvas data
      const patchUrl = `${PATCH_URL_PATTERN}${selectedLibrary}.npy`;

      // Format patches data into initial_positions if available
      const initial_positions = canvasData?.patches.map(patch => [
        extractImageName(patch.src),
        parseFloat(patch.x.toFixed(6)), // Ensure x is a float with proper precision
        parseFloat(patch.y.toFixed(6))  // Ensure y is a float with proper precision
      ]) || [];

      // Format patches color data into initial_colours if available
      const initial_colours = canvasData?.patches.map(patch => {
        const filename = extractImageName(patch.src);
        // Convert RGB values from 0-255 to 0-1 scale
        // Use default values (0.0) if color information isn't available
        const r = patch.red !== undefined ? jsToPythonColor(patch.red) : 0.0;
        const g = patch.green !== undefined ? jsToPythonColor(patch.green) : 0.0;
        const b = patch.blue !== undefined ? jsToPythonColor(patch.blue) : 0.0;

        return [filename, r, g, b];
      }) || [];

      // Log the initial positions and colors for debugging
      console.log(`Sending ${initial_positions.length} initial positions:`, initial_positions);
      console.log(`Sending ${initial_colours.length} initial colors:`, initial_colours);
      console.log(`Using patch URL: ${patchUrl}`);

      // Create form data for multipart/form-data if we have an image
      let requestBody;
      let headers: HeadersInit = {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache"
      };

      if (formData.mode === "image" && formData.image) {
        // For image upload mode, use FormData
        const apiFormData = new FormData();
        apiFormData.append("mode", formData.mode);
        apiFormData.append("numPatches", formData.numPatches.toString());
        apiFormData.append("optimSteps", formData.optimSteps.toString());
        apiFormData.append("image", formData.image);
        apiFormData.append("patch_url", patchUrl);

        if (initial_positions.length > 0) {
          apiFormData.append("initial_positions", JSON.stringify(initial_positions));
        }

        if (initial_colours.length > 0) {
          apiFormData.append("initial_colours", JSON.stringify(initial_colours));
        }

        requestBody = apiFormData;
        // Don't set Content-Type for FormData, browser will set it with boundary
      } else {
        // For text prompt mode, use JSON
        requestBody = JSON.stringify({
          mode: formData.mode,
          prompt: formData.prompt,
          numPatches: formData.numPatches,
          optimSteps: formData.optimSteps,
          initial_positions,
          initial_colours,
          patch_url: patchUrl
        });
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch("/api/replicate/predictions", {
        method: "POST",
        headers,
        body: requestBody,
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error creating prediction: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Created prediction:", data);
      return data;
    } catch (error) {
      console.error("Error creating prediction:", error);
      throw error;
    }
  };

  // Function to get prediction status with cache-busting
  const getPrediction = async (id: string): Promise<PredictionResponse> => {
    try {
      // Add cache-busting query parameter
      const cacheBuster = new Date().getTime();
      const response = await fetch(`/api/replicate/predictions/${id}?_cb=${cacheBuster}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0"
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error getting prediction: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error getting prediction:", error);
      throw error;
    }
  };

  // Function to fetch and parse JSON data from a URL
  const fetchAndParseJson = async (jsonUrl: string): Promise<ParsedPatch[]> => {
    try {
      const response = await fetch(jsonUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch JSON: ${response.statusText}`);
      }

      const jsonData = await response.json();

      // Extract patch information from the JSON
      // The exact structure depends on the API response format
      let patches: ParsedPatch[] = [];

      console.log(jsonData);

      // Use the selectedLibrary prop instead of activeGenerationLibrary
      const library = selectedLibrary;

      // If the JSON is an array of patches
      patches = jsonData.map(item => ({
        patch_id: item.id,
        img_index: item.patch_index,
        x: item.x,
        y: item.y,
        rotation: item.rotation,
        scale: item.scale,
        library: library, // Use the stored library information
        squeeze: item.squeeze,
        shear: item.shear,
        red: item.red,
        green: item.green,
        blue: item.blue,
        order: item.order
      }));

      console.log(patches);
      return patches;
    } catch (error) {
      console.error("Error fetching or parsing JSON:", error);
      toast.error("Failed to load patch data from JSON");
      return [];
    }
  };

  // Function to poll for prediction status with better error handling and logging
  const pollPrediction = async (id: string) => {
    let prediction: PredictionResponse;
    let attempts = 0;
    const maxAttempts = 180; // Up to 3 minutes of polling
    let delay = 1000; // Start with 1 second delay
    let lastOutputLength = 0;

    // Poll until the prediction is complete or max attempts reached
    do {
      attempts++;

      try {
        prediction = await getPrediction(id);

        // Update the status message
        setStatusMessage(`Status: ${prediction.status} (attempt ${attempts})`);

        // Check for terminal states
        if (prediction.status === "failed" || prediction.status === "canceled") {
          throw new Error(prediction.error || "Prediction failed");
        }

        // If we have output, update the results array with any new data
        if (prediction.output && prediction.output.length > 0) {
          // Only update if we have new results
          if (prediction.output.length > lastOutputLength) {
            setGeneratedResults(prediction.output);
            lastOutputLength = prediction.output.length;

            // If we're still processing, update the status to show progress
            if (prediction.status === "processing") {
              setStatusMessage(`Generating vector graphics... ${prediction.output.length} results generated so far`);
            }
          }

          // If we got a successful result, return it immediately
          if (prediction.status === "succeeded") {
            setStatusMessage("Vector graphics generation completed!");

            // If we have results and onPatchesVisualize is provided, process the first JSON
            if (prediction.output.length > 0 && onPatchesVisualize) {
              const [_, jsonUrl] = prediction.output[0]; // Get the first result's JSON URL
              setIsVisualizing(true);
              try {
                const patches = await fetchAndParseJson(jsonUrl);
                setParsedPatches(patches);
                if (patches.length > 0) {
                  onPatchesVisualize(patches);
                  toast.success(`Visualizing ${patches.length} patches on canvas`);
                }
              } catch (error) {
                console.error("Error visualizing patches:", error);
              } finally {
                setIsVisualizing(false);
              }
            }

            return prediction;
          }
        }

        // Dynamic backoff strategy
        if (prediction.status === "processing") {
          delay = 2000; // Check more frequently when we're processing
        } else {
          // Apply exponential backoff up to a reasonable maximum
          delay = Math.min(delay * 1.5, 5000);
        }

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`Error in polling attempt ${attempts}:`, error);
        setStatusMessage(`Error checking status: ${error instanceof Error ? error.message : "Unknown error"}`);

        // If we hit an error during polling, wait a bit longer before retrying
        await new Promise((resolve) => setTimeout(resolve, Math.min(delay * 2, 10000)));
      }
    } while (
      attempts < maxAttempts &&
      (!prediction ||
       (prediction.status !== "succeeded" &&
        prediction.status !== "failed" &&
        prediction.status !== "canceled"))
    );

    // If we reached max attempts without success
    if (attempts >= maxAttempts) {
      throw new Error("Polling timed out. The image may still be generating in the background.");
    }

    return prediction;
  };

  const onSubmit = async (data: FormValues) => {
    console.log("Form Submitted", data);
    console.log("Current mode:", data.mode);
    console.log("Image data:", data.image);

    // Validate that we have the required data for the selected mode
    if (data.mode === "text" && !data.prompt) {
      toast.error("Please enter a text prompt");
      return;
    }

    if (data.mode === "image" && !data.image) {
      toast.error("Please upload an image");
      return;
    }

    setIsGenerating(true);
    setGeneratedResults([]);
    setStatusMessage("Starting generation...");
    setPredictionId(null);

    try {
      // Start the loading toast
      const loadingToast = toast.loading(
        data.mode === "text"
          ? "Generating vector graphic from text prompt..."
          : "Generating vector graphic from image..."
      );

      // Create the prediction
      const prediction = await createPrediction(data);
      setPredictionId(prediction.id);

      setStatusMessage(`Created prediction with ID: ${prediction.id}. ${
        canvasData?.patches.length ?
        `Including ${canvasData.patches.length} initial patch positions and colors. ` :
        ''
      }Waiting for processing...`);

      // Poll for the prediction status
      const result = await pollPrediction(prediction.id);

      // Update the toast and set the generated images
      toast.dismiss(loadingToast);

      if (result.output && result.output.length > 0) {
        setGeneratedResults(result.output);
        toast.success("Vector graphics generated successfully!");
      } else {
        throw new Error("No output generated");
      }
    } catch (error) {
      console.error("Error generating vector graphic:", error);
      setStatusMessage(`Failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate vector graphic",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Function to manually check status (for debugging)
  const checkStatus = async () => {
    if (!predictionId) return;

    try {
      setStatusMessage("Manually checking status...");
      const result = await getPrediction(predictionId);
      setStatusMessage(`Current status: ${result.status}, Has output: ${!!result.output && result.output.length > 0}`);

      if (result.status === "succeeded" && result.output && result.output.length > 0) {
        setGeneratedResults(result.output);
        toast.success("Vector graphics found!");
      }
    } catch (error) {
      setStatusMessage(`Error checking status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <>
      <div className="w-full space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">Create Mosaic</h2>
          <p className="text-sm text-gray-600 mb-4">
            Generate patches using AI and arrange them to create your mosaic
          </p>
        </div>

        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={() => handleModeChange("text")}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              currentMode === "text"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            disabled={isGenerating}
          >
            Text Prompt
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("image")}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              currentMode === "image"
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
            disabled={isGenerating}
          >
            Image Upload
          </button>
        </div>

        <form onSubmit={formSubmitHandler} className="space-y-4">
          <input type="hidden" {...register("mode")} />

          {currentMode === "text" && (
            <div>
              <label
                htmlFor="prompt"
                className="block text-sm font-medium text-gray-700"
              >
                Prompt
              </label>
              <textarea
                id="prompt"
                rows={3}
                className="mosaic-input mt-1 block w-full"
                placeholder="Describe what you want to generate..."
                {...register("prompt")}
                disabled={isGenerating}
              />
              {errors.prompt && (
                <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
              )}
            </div>
          )}

          {currentMode === "image" && (
            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700"
              >
                Upload Reference Image
              </label>
              <div className="mt-1 flex items-center justify-center w-full">
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  {imagePreview ? (
                    <div className="relative w-full h-full p-2">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setValue("image", undefined);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                        disabled={isGenerating}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF or WEBP (MAX. 5MB)</p>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif, image/webp"
                    onChange={handleImageChange}
                    disabled={isGenerating}
                  />
                </label>
              </div>
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image.message}</p>
              )}
            </div>
          )}

        {/* Add Library Selection Dropdown */}
        <div>
          <label
            htmlFor="librarySelect"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Patch Library
          </label>
          <select
            id="librarySelect"
            value={selectedLibrary}
            onChange={(e) => handleLibraryChange(e.target.value as PatchLibraryType)}
            className="mosaic-input w-full"
            disabled={isGenerating}
          >
            {Object.entries(LIBRARY_METADATA).map(([key, library]) => (
              <option key={key} value={key}>
                {library.displayName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Select which patch library to use for generation
          </p>
        </div>

          <div>
            <label
              htmlFor="numPatches"
              className="block text-sm font-medium text-gray-700"
            >
              Number of Patches (1-250)
            </label>
            <input
              id="numPatches"
              type="number"
              min="1"
              max="250"
              className="mosaic-input mt-1 block w-full"
              {...register("numPatches", {
                valueAsNumber: true,
                min: { value: 1, message: "Minimum 1 patch" },
                max: { value: 250, message: "Maximum 250 patches" }
              })}
              disabled={isGenerating}
            />
            {errors.numPatches && (
              <p className="mt-1 text-sm text-red-600">{errors.numPatches.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="optimSteps"
              className="block text-sm font-medium text-gray-700"
            >
              Optimization Steps (1-15,000)
            </label>
            <div className="mt-1 relative">
              <input
                id="optimSteps"
                type="number"
                min="1"
                max="15000"
                className="mosaic-input block w-full"
                {...register("optimSteps", {
                  valueAsNumber: true,
                  min: { value: 1, message: "Minimum 1 step" },
                  max: { value: 15000, message: "Maximum 15,000 steps" }
                })}
                disabled={isGenerating}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-500 text-xs">Default: 250</span>
              </div>
            </div>
            {errors.optimSteps && (
              <p className="mt-1 text-sm text-red-600">{errors.optimSteps.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Higher values may produce better results but take longer to generate. Recommended range: 100-1000.
            </p>
          </div>

          {canvasData && canvasData.patches.length > 0 && (
            <div className="rounded-md bg-gray-50 p-2 text-sm text-gray-700 border border-gray-200">
              <p className="font-medium">Canvas Data</p>
              <p>{canvasData.patches.length} patches will be included in the generation</p>
              <p className="text-xs mt-1">Patch positions will be sent to the AI model to influence the generated result</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isGenerating || (currentMode === "image" && !imagePreview) || (currentMode === "text" && !watch("prompt"))}
            className="w-full rounded-md bg-[#ff0084] px-4 py-2 text-white hover:bg-[#e5007a] focus:outline-none focus:ring-2 focus:ring-[#ff0084] focus:ring-offset-2 disabled:bg-gray-400 transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate Mosaic"}
          </button>
        </form>

        {statusMessage && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
            <p className="font-medium text-gray-700">Status:</p>
            <p className="text-gray-600">{statusMessage}</p>

            {predictionId && !generatedResults.length && (
              <button
                onClick={checkStatus}
                className="mt-2 text-[#ff0084] hover:text-[#e5007a] text-sm font-medium"
              >
                Check Status Manually
              </button>
            )}
          </div>
        )}

        {parsedPatches.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
            <p className="font-medium">Patches Visualized:</p>
            <p>{parsedPatches.length} patches placed on canvas</p>
          </div>
        )}
      </div>

      {/* Render results in the right column using portal */}
      {resultsContainerRef.current && generatedResults.length > 0 && createPortal(
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {[...generatedResults].reverse().map((pair, index) => {
              const [imageUrl, jsonUrl] = pair;
              return (
                <div key={index} className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                  <img
                    src={imageUrl}
                    alt={`Generated mosaic ${index + 1}`}
                    className="w-full"
                  />
                  <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                    <a
                      href={jsonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#ff0084] hover:text-[#e5007a]"
                    >
                      View JSON data
                    </a>
                    {onPatchesVisualize && (
                      <button
                        onClick={async () => {
                          setIsVisualizing(true);
                          try {
                            const patches = await fetchAndParseJson(jsonUrl);
                            setParsedPatches(patches);
                            if (patches.length > 0) {
                              onPatchesVisualize(patches);
                              toast.success(`Visualizing ${patches.length} patches on canvas`);
                            } else {
                              toast.error("No patch data found to visualize");
                            }
                          } catch (error) {
                            console.error("Error visualizing patches:", error);
                            toast.error("Failed to visualize patches");
                          } finally {
                            setIsVisualizing(false);
                          }
                        }}
                        disabled={isVisualizing}
                        className="text-xs bg-gray-100 text-[#ff0084] px-2 py-1 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        {isVisualizing ? "Visualizing..." : "Apply to Canvas"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>,
        resultsContainerRef.current
      )}
    </>
  );
}