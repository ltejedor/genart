export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import Replicate from "replicate";
import type { Prediction } from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

interface RequestBody {
  prompt: string;
  patches?: Array<{
    src: string;
    x: number;
    y: number;
  }>;
  initial_positions?: Array<[string, number, number]>;
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
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  try {
    const { prompt, patches = [], initial_positions }: RequestBody = await request.json() as RequestBody;

    // Start prediction using the Replicate SDK
    const prediction = await replicate.predictions.create({
      version: "2f0207fe8c5953b0be5b1d2fee8f7975f00db7083783204d36f6e3c2a15b267c",
      input: { 
        prompt,
        // Format patches data into initial_positions if available
        ...(patches.length > 0 && { 
          initial_positions: patches.map(patch => [
            extractImageName(patch.src),
            parseFloat(patch.x.toFixed(6)), // Ensure x is a float with proper precision
            parseFloat(patch.y.toFixed(6))  // Ensure y is a float with proper precision
          ])
        }),
        // Include initial_positions directly if provided
        ...(initial_positions && { initial_positions })
      }
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