# Generative Art for Humans

A creative web application that combines interactive animal image manipulation with AI-powered vector graphics generation. This project allows users to arrange animal images on a canvas and generate vector graphics based on text prompts.

![Generative Art for Humans](https://replicate.delivery/pbxt/IUgEyxWIrDXGRp3cObFJVHaRdOpTEGjOnjFIeVRUXSgPYHhQA/out.png)

*Live at https://genart-xi.vercel.app/*

## Features

### Canvas Manipulation
- Add images from a gallery to a canvas
- Drag and position patches with normalized coordinates
- Select, deselect, and remove patches
- Clear the entire canvas
- Automatic z-index management for layering

### Vector Graphics Generation
- Generate vector graphics using the [Differentiable Rasterizer Vector Graphics](https://replicate.com/ltejedor/differentiable-rasterizer-vector-graphics) model
- Real-time streaming of generation progress
- Customize optimization steps for generation quality
- View generated images as they're created
- Automatic rearrangement of canvas elements based on the prompt

## Technologies Used

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **API Communication**: tRPC
- **Form Handling**: react-hook-form
- **Notifications**: react-hot-toast
- **Database**: Prisma with PostgreSQL
- **Validation**: Zod
- **AI Integration**: Replicate API

## Setup

### Prerequisites
- Node.js (v18 or later)
- npm or yarn
- PostgreSQL database (optional for full functionality)

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:ltejedor/genart.git
   cd genart
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   NODE_ENV="development"
   REPLICATE_API_TOKEN="your-replicate-api-token"
   ```

   You'll need to get a Replicate API token from [replicate.com](https://replicate.com).

4. Set up the database (optional):
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Graphics Generation

1. On the main page, add and arrange animals on the canvas (optional)
2. In the "Generate Vector Graphics" section:
   - Enter a text prompt describing what you want to generate
   - Adjust the optimization steps (higher values produce better results but take longer)
   - Click "Generate" to start the process
3. Watch as images are generated in real-time
4. When generation is complete, the animals on your canvas will rearrange based on your prompt

## About the Replicate Model

This application uses the [Differentiable Rasterizer Vector Graphics](https://replicate.com/ltejedor/differentiable-rasterizer-vector-graphics) model created by ltejedor on Replicate.

The model converts text prompts into vector graphics by:
1. Interpreting the text description
2. Generating vector paths and shapes
3. Optimizing the vectors through multiple iterations
4. Producing SVG-compatible output

The number of optimization steps controls the quality and detail of the generated graphics. Higher values (up to 1000) produce more refined results but take longer to generate.

## Project Structure

- `/src/app`: Next.js app router pages
  - `/page.tsx`: Main page with both canvas and vector generation
  - `/canvas/page.tsx`: Dedicated canvas page
- `/src/components`: React components
  - `AnimalCanvas.tsx`: Canvas for animal placement
  - `AnimalGallery.tsx`: Gallery of available animals
  - `CanvasControls.tsx`: Controls for canvas manipulation
  - `DraggableAnimal.tsx`: Draggable animal component
  - `VectorGraphicsForm.tsx`: Form for vector generation
  - `VectorGraphicsResults.tsx`: Display for generated results
- `/src/lib/server`: Server-side utilities
  - `replicate.ts`: Integration with Replicate API
- `/src/server/api`: tRPC API setup
  - `/procedures`: tRPC procedures for vector generation
- `/public/animals`: Animal image assets


