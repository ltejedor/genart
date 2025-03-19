"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

// Define the form schema using zod
const formSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

type FormValues = z.infer<typeof formSchema>;

// Define the prediction response types
type PredictionResponse = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string[] | null;
  error?: string;
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
    }>;
  };
};

// Helper function to extract the image name from the src path
const extractImageName = (src: string): string => {
  // Extract just the filename from the path
  const filename = src.split('/').pop() || '';
  return filename;
};

export function VectorGraphicsForm({ canvasData }: VectorGraphicsFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [predictionId, setPredictionId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  // Function to create a prediction with error handling
  const createPrediction = async (prompt: string) => {
    try {
      // Format patches data into initial_positions if available
      const initial_positions = canvasData?.patches.map(patch => [
        extractImageName(patch.src),
        parseFloat(patch.x.toFixed(6)), // Ensure x is a float with proper precision
        parseFloat(patch.y.toFixed(6))  // Ensure y is a float with proper precision
      ]) || [];

      console.log("Sending initial_positions:", initial_positions);

      const response = await fetch("/api/replicate/predictions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        },
        body: JSON.stringify({
          prompt,
          initial_positions
        }),
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

        // If we have output, update the images array with any new images
        if (prediction.output && prediction.output.length > 0) {
          // Only update if we have new images
          if (prediction.output.length > lastOutputLength) {
            setGeneratedImages(prediction.output);
            lastOutputLength = prediction.output.length;
            
            // If we're still processing, update the status to show progress
            if (prediction.status === "processing") {
              setStatusMessage(`Generating images... ${prediction.output.length} generated so far`);
            }
          }
          
          // If we got a successful result, return it immediately
          if (prediction.status === "succeeded") {
            setStatusMessage("Image generation completed!");
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
    setIsGenerating(true);
    setGeneratedImages([]);
    setStatusMessage("Starting generation...");
    setPredictionId(null);

    try {
      // Start the loading toast
      const loadingToast = toast.loading("Generating vector graphic...");

      // Create the prediction
      const prediction = await createPrediction(data.prompt);
      setPredictionId(prediction.id);

      setStatusMessage(`Created prediction with ID: ${prediction.id}. Waiting for processing...`);

      // Poll for the prediction status
      const result = await pollPrediction(prediction.id);

      // Update the toast and set the generated images
      toast.dismiss(loadingToast);

      if (result.output && result.output.length > 0) {
        setGeneratedImages(result.output);
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
        setGeneratedImages(result.output);
        toast.success("Vector graphics found!");
      }
    } catch (error) {
      setStatusMessage(`Error checking status: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Generate Vector Graphics</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter a prompt to generate AI-created vector graphics
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            placeholder="Describe what you want to generate..."
            {...register("prompt")}
            disabled={isGenerating}
          />
          {errors.prompt && (
            <p className="mt-1 text-sm text-red-600">{errors.prompt.message}</p>
          )}
        </div>

        {canvasData && canvasData.patches.length > 0 && (
          <div className="rounded-md bg-blue-50 p-2 text-sm text-blue-700">
            <p className="font-medium">Canvas Data</p>
            <p>{canvasData.patches.length} patches will be included in the generation</p>
            <p className="text-xs mt-1">Positions will be sent in the required format for AI processing</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isGenerating ? "Generating..." : "Generate Vector Graphic"}
        </button>
      </form>

      {statusMessage && (
        <div className="mt-4 p-2 bg-gray-100 rounded-md text-sm">
          <p className="font-medium">Status:</p>
          <p>{statusMessage}</p>

          {predictionId && !generatedImages.length && (
            <button
              onClick={checkStatus}
              className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Check Status Manually
            </button>
          )}
        </div>
      )}

      {generatedImages.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-lg font-medium">Generated Images ({generatedImages.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {generatedImages.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-lg border border-gray-300">
                <img
                  src={image}
                  alt={`Generated vector graphic ${index + 1}`}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}