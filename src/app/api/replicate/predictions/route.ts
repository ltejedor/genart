export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import Replicate from "replicate";
import type { Prediction } from "replicate";
import { env } from "@/env";

const replicate = new Replicate({
  auth: env.REPLICATE_API_TOKEN,
});

interface RequestBody {
  mode: "text" | "image";
  prompt?: string;
  numPatches?: number;
  optimSteps?: number;
  patches?: Array<{
    src: string;
    x: number;
    y: number;
  }>;
  initial_positions?: Array<[string, number, number]>;
  image?: File;
  patch_url?: string;
}

interface PredictionWithError extends Prediction {
  error?: string;
}

// Helper function to extract the image name from the src path
function extractImageName(src: string): string {
  // Extract just the filename from the path
  const filename = src.split('/').pop() || '';
  return filename;
}

export async function POST(request: Request) {
  if (!env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  try {
    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type") || "";
    let mode: "text" | "image";
    let prompt: string | undefined;
    let numPatches: number = 5;
    let optimSteps: number = 250;
    let initial_positions: Array<[string, number, number]> | undefined;
    let imageBuffer: ArrayBuffer | undefined;
    let patch_url: string | undefined | null;

    if (contentType.includes("multipart/form-data")) {
      // Handle form data with image upload
      const formData = await request.formData();
      mode = formData.get("mode") as "text" | "image";
      numPatches = parseInt(formData.get("numPatches") as string) || 5;
      const optimStepsValue = parseInt(formData.get("optimSteps") as string);
      optimSteps = isNaN(optimStepsValue) ? 250 : optimStepsValue;

      // Get initial positions if available
      const initialPositionsStr = formData.get("initial_positions");
      if (initialPositionsStr && typeof initialPositionsStr === "string") {
        initial_positions = JSON.parse(initialPositionsStr);
      }

      // Get the patch_url if available
      patch_url = formData.get("patch_url") as string | null;

      // Get the image file
      const imageFile = formData.get("image") as File | null;
      if (imageFile) {
        imageBuffer = await imageFile.arrayBuffer();
      }
    } else {
      // Handle JSON request
      const json = await request.json() as RequestBody;
      mode = json.mode;
      prompt = json.prompt;
      numPatches = json.numPatches || 5;
      optimSteps = json.optimSteps || 250;
      initial_positions = json.initial_positions;
      patch_url = json.patch_url;
    }

    // Validate numPatches is within reasonable limits
    const validatedNumPatches = Math.min(Math.max(1, numPatches), 250);

    // Validate optimSteps is within reasonable limits
    const validatedOptimSteps = Math.min(Math.max(1, optimSteps), 15000);

    // Prepare the input for Replicate based on the mode
    const baseInput = {
      num_patches: validatedNumPatches,
      optim_steps: validatedOptimSteps,
      ...(initial_positions && { initial_positions }),
      ...(patch_url && { patch_url }),
    };

    let input;
    if (mode === "text" && prompt) {
      // Text prompt mode - use CLIP loss
      input = {
        ...baseInput,
        prompt,
        loss: "CLIP",
      };
    } else if (mode === "image" && imageBuffer) {
      // Image upload mode - use MSE loss
      // Convert ArrayBuffer to base64
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      input = {
        ...baseInput,
        loss: "MSE",
        target_image: dataUrl,
      };
    } else {
      return NextResponse.json(
        { error: "Invalid request parameters. Check mode and provide either prompt or image." },
        { status: 400 }
      );
    }

    // Log the input for debugging
    console.log("Sending to Replicate with input:", {
      ...input,
      ...(imageBuffer ? { target_image: "[base64 image data]" } : {}),
    });

    // Start prediction using the Replicate SDK
    const prediction = await replicate.predictions.create({
      version: "83b469c29d1429837e9df748b393a40f301a9faa759f95c90add1873e1290116",
      input,
    }) as PredictionWithError;

    if (prediction.error) {
      return NextResponse.json({ detail: prediction.error }, { status: 500 });
    }

    // Create response with no-cache headers
    const response = NextResponse.json(prediction, { status: 201 });
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Error creating prediction:", error);
    return NextResponse.json(
      { error: "Failed to create prediction" },
      { status: 500 }
    );
  }
}
