export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import Replicate from "replicate";
import type { Prediction } from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

interface RequestBody {
  prompt: string;
}

interface PredictionWithError extends Prediction {
  error?: string;
}

export async function POST(request: Request) {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  try {
    const { prompt }: RequestBody = await request.json() as RequestBody;

    // Start prediction using the Replicate SDK
    const prediction = await replicate.predictions.create({
      version: "2f0207fe8c5953b0be5b1d2fee8f7975f00db7083783204d36f6e3c2a15b267c",
      input: { prompt }
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
