"use client";

import { useState, useEffect } from "react";
import { type PlacedPatch } from "./InteractiveCanvas";

type PropertyEditorProps = {
  selectedPatch: PlacedPatch | null;
  onPatchUpdate: (updatedPatch: PlacedPatch) => void;
};

export function PropertyEditor({ selectedPatch, onPatchUpdate }: PropertyEditorProps) {
  // Local state to track property changes
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [squeeze, setSqueeze] = useState(0);
  const [shear, setShear] = useState(0);
  const [colors, setColors] = useState({ red: 1, green: 1, blue: 1 });

  // Update local state when selected patch changes
  useEffect(() => {
    if (selectedPatch) {
      setPosition({ x: selectedPatch.x, y: selectedPatch.y });
      setRotation(selectedPatch.rotation || 0);
      setScale(selectedPatch.scale || 1);
      setSqueeze(selectedPatch.squeeze || 0);
      setShear(selectedPatch.shear || 0);
      setColors({
        red: selectedPatch.red !== undefined ? selectedPatch.red : 1,
        green: selectedPatch.green !== undefined ? selectedPatch.green : 1,
        blue: selectedPatch.blue !== undefined ? selectedPatch.blue : 1,
      });
    }
  }, [selectedPatch]);

  // Handle property changes
  const handlePropertyChange = (property: string, value: number) => {
    if (!selectedPatch) return;

    let updatedPatch: PlacedPatch;

    switch (property) {
      case "x":
        setPosition(prev => ({ ...prev, x: value }));
        updatedPatch = { ...selectedPatch, x: value };
        break;
      case "y":
        setPosition(prev => ({ ...prev, y: value }));
        updatedPatch = { ...selectedPatch, y: value };
        break;
      case "rotation":
        setRotation(value);
        updatedPatch = { ...selectedPatch, rotation: value };
        break;
      case "scale":
        setScale(value);
        updatedPatch = { ...selectedPatch, scale: value };
        break;
      case "squeeze":
        setSqueeze(value);
        updatedPatch = { ...selectedPatch, squeeze: value };
        break;
      case "shear":
        setShear(value);
        updatedPatch = { ...selectedPatch, shear: value };
        break;
      case "red":
        setColors(prev => ({ ...prev, red: value }));
        updatedPatch = { ...selectedPatch, red: value };
        break;
      case "green":
        setColors(prev => ({ ...prev, green: value }));
        updatedPatch = { ...selectedPatch, green: value };
        break;
      case "blue":
        setColors(prev => ({ ...prev, blue: value }));
        updatedPatch = { ...selectedPatch, blue: value };
        break;
      default:
        return;
    }

    // Call the onPatchUpdate prop with the updated patch
    onPatchUpdate(updatedPatch);
  };

  if (!selectedPatch) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500">
        <p>Select a patch on the canvas to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-lg font-medium mb-4">Patch Properties</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Position Controls */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Position</h4>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">X Position ({position.x.toFixed(2)})</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={position.x}
              onChange={(e) => handlePropertyChange("x", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Y Position ({position.y.toFixed(2)})</label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={position.y}
              onChange={(e) => handlePropertyChange("y", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Transformation Controls */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Transformations</h4>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Rotation ({rotation.toFixed(0)}°)</label>
            <input
              type="range"
              min="0"
              max="360"
              step="1"
              value={rotation}
              onChange={(e) => handlePropertyChange("rotation", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Scale ({scale.toFixed(2)})</label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={scale}
              onChange={(e) => handlePropertyChange("scale", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Advanced Transformations */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Advanced Transformations</h4>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Squeeze ({squeeze.toFixed(2)})</label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.01"
              value={squeeze}
              onChange={(e) => handlePropertyChange("squeeze", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Shear ({shear.toFixed(2)})</label>
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.01"
              value={shear}
              onChange={(e) => handlePropertyChange("shear", parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Color Adjustments */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Color Adjustments</h4>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Red ({colors.red.toFixed(2)})</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={colors.red}
              onChange={(e) => handlePropertyChange("red", parseFloat(e.target.value))}
              className="w-full accent-red-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Green ({colors.green.toFixed(2)})</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={colors.green}
              onChange={(e) => handlePropertyChange("green", parseFloat(e.target.value))}
              className="w-full accent-green-500"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs text-gray-600">Blue ({colors.blue.toFixed(2)})</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={colors.blue}
              onChange={(e) => handlePropertyChange("blue", parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}