/**
 * Utility functions for converting between Python and JavaScript coordinate systems
 *
 * The Python coordinate system used by the Replicate API and the JavaScript coordinate
 * system used by the Konva canvas have different conventions for transformations.
 * These functions convert between the two systems.
 */

/**
 * Convert rotation from Python to JavaScript coordinate system
 * Based on our optimization, we apply a scaling factor and modulo to handle the circular nature
 *
 * @param rotation Rotation angle in radians (Python)
 * @returns Rotation angle in degrees (JavaScript)
 */
export function pythonToJsRotation(rotation: number): number {
  // Apply the optimized conversion formula
  let jsRotation = (rotation * 55.6635311) % 360;

  // Ensure rotation is in the 0-359 range
  if (jsRotation < 0) jsRotation += 360;

  return jsRotation;
}

/**
 * Convert rotation from JavaScript to Python coordinate system
 * Approximate inverse of the pythonToJsRotation function
 *
 * @param rotation Rotation angle in degrees (JavaScript)
 * @returns Rotation angle in radians (Python)
 */
export function jsToPythonRotation(rotation: number): number {
  // Approximate inverse of the pythonToJsRotation formula
  return rotation / 55.6635311;
}

/**
 * Convert scale from Python to JavaScript coordinate system
 * Based on our optimization, both scale and squeeze affect JS scale
 *
 * @param scale Scale factor (Python)
 * @param squeeze Squeeze value (Python)
 * @returns Scale factor (JavaScript)
 */
export function pythonToJsScale(scale: number, squeeze: number, shear: number): number {
  return scale * 0.80003054 + squeeze * 0.017701143 + shear * 0.016935179;
}

/**
 * Convert scale from JavaScript to Python coordinate system
 * Approximate inverse of the pythonToJsScale function
 *
 * @param scale Scale factor (JavaScript)
 * @param squeeze Squeeze value (Python) - needed to reverse the conversion
 * @param shear
 * @returns Scale factor (Python)
 */
export function jsToPythonScale(scale: number, squeeze: number): number {
  return (scale - squeeze * 0.0642944) / 0.80003054;
}

/**
 * Convert squeeze from Python to JavaScript coordinate system
 * Based on our optimization, all Python params can affect JS squeeze
 *
 * @param scale Scale factor (Python)
 * @param squeeze Squeeze value (Python)
 * @returns Squeeze value (JavaScript)
 */
export function pythonToJsSqueeze(
  scale: number,
  squeeze: number,
): number {
  return scale * 0.064294401 + squeeze * 0.00870305;
}

/**
 * Convert squeeze from JavaScript to Python coordinate system
 * This is an approximation since the forward conversion depends on multiple parameters
 *
 * @param squeeze Squeeze value (JavaScript)
 * @returns Squeeze value (Python)
 */
export function jsToPythonSqueeze(squeeze: number): number {
  // This is a simplification - for accuracy, we'd need all parameters
  return squeeze;
}

/**
 * Convert shear from Python to JavaScript coordinate system
 * Based on our optimization, Python scale and shear affect JS shear
 *
 * @param squeeze Scale factor (Python)
 * @param shear Shear value (Python)
 * @returns Shear value (JavaScript)
 */
export function pythonToJsShear(squeeze: number, shear: number): number {
  return squeeze * 0.013955148 + shear * 0.939783266;
}

/**
 * Convert shear from JavaScript to Python coordinate system
 * Approximate inverse of the pythonToJsShear function
 *
 * @param shear Shear value (JavaScript)
 * @param scale Scale factor (Python) - needed to reverse the conversion
 * @returns Shear value (Python)
 */
export function jsToPythonShear(shear: number, scale: number): number {
  return (shear - scale * 0.01693518) / 0.93978327;
}

/**
 * Convert RGB color values from Python (0-1) to JavaScript (0-255)
 *
 * @param color RGB color value between 0-1 (Python)
 * @returns RGB color value between 0-255 (JavaScript)
 */
export function pythonToJsColor(color: number): number {
  return Math.min(Math.round(color * 256), 255);
}

/**
 * Convert RGB color values from JavaScript (0-255) to Python (0-1)
 *
 * @param color RGB color value between 0-255 (JavaScript)
 * @returns RGB color value between 0-1 (Python)
 */
export function jsToPythonColor(color: number): number {
  return color / 256;
}

/**
 * Convert a patch object from Python to JavaScript coordinate system
 *
 * @param patch Patch object with Python coordinate system values
 * @returns Patch object with JavaScript coordinate system values
 */
export function convertPatchFromPythonToJs(patch: {
  rotation?: number;
  scale?: number;
  squeeze?: number;
  shear?: number;
  red?: number;
  green?: number;
  blue?: number;
  [key: string]: any;
}) {
  const result = { ...patch };

  if (result.rotation !== undefined) {
    result.rotation = pythonToJsRotation(result.rotation);
  }

  if (result.scale !== undefined && result.squeeze !== undefined && result.shear !== undefined) {
    result.scale = pythonToJsScale(result.scale, result.squeeze, result.shear);
  }

  if (result.scale !== undefined &&
      result.squeeze !== undefined) {
    result.squeeze = pythonToJsSqueeze(
      result.scale,
      result.squeeze,
    );
  }

  if (result.scale !== undefined && result.shear !== undefined) {
    result.shear = pythonToJsShear(result.scale, result.shear);
  }

  // Convert colors if present
  if (result.red !== undefined) {
    result.red = pythonToJsColor(result.red);
  }

  if (result.green !== undefined) {
    result.green = pythonToJsColor(result.green);
  }

  if (result.blue !== undefined) {
    result.blue = pythonToJsColor(result.blue);
  }

  return result;
}

/**
 * Convert a patch object from JavaScript to Python coordinate system
 *
 * @param patch Patch object with JavaScript coordinate system values
 * @returns Patch object with Python coordinate system values
 */
export function convertPatchFromJsToPython(patch: {
  rotation?: number;
  scale?: number;
  squeeze?: number;
  shear?: number;
  red?: number;
  green?: number;
  blue?: number;
  [key: string]: any;
}) {
  const result = { ...patch };

  if (result.rotation !== undefined) {
    result.rotation = jsToPythonRotation(result.rotation);
  }

  // Note: The order matters for inverse transformations
  // We need to convert parameters in the reverse order of the forward transformation

  if (result.scale !== undefined && result.shear !== undefined) {
    result.shear = jsToPythonShear(result.shear, result.scale);
  }

  if (result.squeeze !== undefined) {
    result.squeeze = jsToPythonSqueeze(result.squeeze);
  }

  if (result.scale !== undefined && result.squeeze !== undefined) {
    result.scale = jsToPythonScale(result.scale, result.squeeze);
  }

  // Convert colors if present
  if (result.red !== undefined) {
    result.red = jsToPythonColor(result.red);
  }

  if (result.green !== undefined) {
    result.green = jsToPythonColor(result.green);
  }

  if (result.blue !== undefined) {
    result.blue = jsToPythonColor(result.blue);
  }

  return result;
}
