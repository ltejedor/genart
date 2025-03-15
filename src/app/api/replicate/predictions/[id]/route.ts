import { NextResponse } from "next/server";
import { env } from "@/env";

// Define a more aggressive cache control function
const addNoCacheHeaders = (headers = new Headers()) => {
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  headers.set("Pragma", "no-cache");
  headers.set("Expires", "0");
  headers.set("Surrogate-Control", "no-store");
  return headers;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: "Prediction ID is required" },
        { status: 400 }
      );
    }

    // Add a cache-busting query parameter with the current timestamp
    const cacheBuster = new Date().getTime();
    const url = `https://api.replicate.com/v1/predictions/${id}?_cb=${cacheBuster}`;

    // Create headers with strong no-cache directives
    const headers = addNoCacheHeaders(new Headers());
    headers.set("Authorization", `Token ${env.REPLICATE_API_TOKEN}`);
    headers.set("Content-Type", "application/json");

    console.log(`Fetching prediction status for ${id} at ${new Date().toISOString()}`);

    const response = await fetch(url, {
      headers,
      // Add these to prevent caching at the fetch level
      cache: "no-store",
      next: { revalidate: 0 }
    });

    console.log(response)

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Error response from Replicate:`, errorData);
      return NextResponse.json(
        { error: errorData.detail || "Error getting prediction" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Prediction status: ${data.status}, ID: ${id}`);

    // Create a response with appropriate headers
    const jsonResponse = NextResponse.json(data);

    // Add cache control headers to the response as well
    addNoCacheHeaders(jsonResponse.headers);

    return jsonResponse;
  } catch (error) {
    console.error("Error getting prediction:", error);
    return NextResponse.json(
      { error: "Failed to get prediction" },
      { status: 500 }
    );
  }
}
