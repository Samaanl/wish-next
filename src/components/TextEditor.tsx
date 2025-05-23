import React, { useEffect, useRef, useState } from "react";
import { OccasionImage, downloadImage } from "@/utils/imageService";
import dynamic from "next/dynamic";

// Dynamically import fabric to avoid SSR issues
const loadFabric = async () => {
  const fabricModule = await import("fabric");
  return fabricModule.default;
};

interface TextEditorProps {
  wish: string;
  selectedImage: OccasionImage;
  onBack: () => void;
  onSave: (dataUrl: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({
  wish,
  selectedImage,
  onBack,
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<any>(null);
  const [textColor, setTextColor] = useState("#ffffff");
  const [fontSize, setFontSize] = useState(24);
  const [textShadow, setTextShadow] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState("Arial");
  const [fabric, setFabric] = useState<any>(null);

  const colorOptions = [
    "#ffffff", // White
    "#000000", // Black
    "#FFC0CB", // Pink
    "#FF69B4", // Hot Pink
    "#FF1493", // Deep Pink
    "#C71585", // Medium Violet Red
    "#DB7093", // Pale Violet Red
    "#FF00FF", // Fuchsia
    "#FF0000", // Red
    "#DC143C", // Crimson
    "#FF4500", // Orange Red
    "#FF8C00", // Dark Orange
    "#FFA500", // Orange
    "#FFD700", // Gold
    "#FFFF00", // Yellow
    "#ADFF2F", // Green Yellow
    "#00FF00", // Lime
    "#32CD32", // Lime Green
    "#008000", // Green
    "#006400", // Dark Green
    "#00FFFF", // Aqua
    "#00CED1", // Dark Turquoise
    "#40E0D0", // Turquoise
    "#0000FF", // Blue
    "#0000CD", // Medium Blue
    "#00008B", // Dark Blue
    "#4169E1", // Royal Blue
    "#8A2BE2", // Blue Violet
    "#9400D3", // Dark Violet
    "#9932CC", // Dark Orchid
    "#800080", // Purple
    "#4B0082", // Indigo
    "#A52A2A", // Brown
    "#D2691E", // Chocolate
    "#708090", // Slate Gray
    "#808080", // Gray
    "#A9A9A9", // Dark Gray
    "#D3D3D3", // Light Gray
    "#F5F5F5", // White Smoke
  ];

  const fontOptions = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Courier New",
    "Georgia",
    "Palatino",
    "Garamond",
    "Comic Sans MS",
    "Impact",
    "Lucida Sans",
    "Tahoma",
    "Verdana",
  ];

  // Load fabric.js
  useEffect(() => {
    const loadFabricLibrary = async () => {
      try {
        const fabricInstance = await loadFabric();
        setFabric(fabricInstance);
      } catch (err) {
        console.error("Failed to load fabric.js:", err);
        setError("Failed to load the editor. Please try again.");
        setLoading(false);
      }
    };

    loadFabricLibrary();
  }, []);
  // Initialize canvas with fabric.js when it's loaded
  useEffect(() => {
    if (!fabric || !canvasRef.current) return;

    const setupCanvas = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`Setting up canvas for image: ${selectedImage.fullUrl}`);

        // Initialize canvas
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
          backgroundColor: "#f0f0f0",
          preserveObjectStacking: true,
        });

        fabricCanvasRef.current = fabricCanvas;

        // Load image
        console.log(`Attempting to download image: ${selectedImage.fullUrl}`);
        let img;
        try {
          img = await downloadImage(selectedImage.fullUrl);
          console.log("Image downloaded successfully");
        } catch (imgError) {
          console.error("Error downloading image:", imgError);

          // Try fallback to placeholder if real image fails
          if (!selectedImage.fullUrl.includes("placehold.co")) {
            console.log("Attempting to use placeholder image instead");
            const placeholderSize = 600;
            const placeholderUrl = `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${selectedImage.occasion}`;
            img = await downloadImage(placeholderUrl);
          } else {
            throw imgError; // Re throw if even the placeholder fails
          }
        }

        // Create fabric image and add to canvas
        const fabricImage = new fabric.Image(img, {
          selectable: false,
          evented: false,
        });

        // Scale canvas to match image aspect ratio while maintaining a reasonable size
        const canvasWidth = Math.min(window.innerWidth - 40, 600);
        const scaleFactor = canvasWidth / img.width;
        const canvasHeight = img.height * scaleFactor;

        fabricCanvas.setWidth(canvasWidth);
        fabricCanvas.setHeight(canvasHeight);

        // Scale the image to fit the canvas
        fabricImage.scaleToWidth(canvasWidth);

        fabricCanvas.add(fabricImage);

        // Add text
        const textOptions: any = {
          left: canvasWidth / 2,
          top: canvasHeight / 2,
          originX: "center",
          originY: "center",
          fontSize,
          fontFamily,
          fill: textColor,
          textAlign: "center",
          width: canvasWidth * 0.8,
          editable: true,
        };

        if (textShadow) {
          textOptions.shadow = new fabric.Shadow({
            color: "rgba(0,0,0,0.6)",
            blur: 5,
            offsetX: 2,
            offsetY: 2,
          });
        }

        const text = new fabric.Textbox(wish, textOptions);
        fabricCanvas.add(text);
        fabricCanvas.setActiveObject(text);

        // Render
        fabricCanvas.renderAll();
      } catch (error) {
        console.error("Error setting up canvas:", error);
        setError(
          `Failed to setup the editor: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please try another image.`
        );
      } finally {
        setLoading(false);
      }
    };

    setupCanvas();

    // Clean up on unmount
    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, [
    fabric,
    selectedImage.fullUrl,
    selectedImage.occasion,
    wish,
    fontSize,
    fontFamily,
    textColor,
    textShadow,
  ]);

  // Apply changes when text properties change
  const updateTextProperties = (property: string, value: any) => {
    if (!fabricCanvasRef.current) return;

    const activeObject = fabricCanvasRef.current.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
      if (property === "shadow") {
        if (value) {
          activeObject.set({
            shadow: new fabric.Shadow({
              color: "rgba(0,0,0,0.6)",
              blur: 5,
              offsetX: 2,
              offsetY: 2,
            }),
          });
        } else {
          activeObject.set({ shadow: null });
        }
      } else {
        // For other properties like color, fontSize, fontFamily
        activeObject.set({ [property]: value });
      }

      fabricCanvasRef.current.renderAll();
    }
  };

  // Handle color changes
  const handleColorChange = (color: string) => {
    setTextColor(color);
    updateTextProperties("fill", color);
  };

  // Handle font size changes
  const handleFontSizeChange = (size: number) => {
    setFontSize(size);
    updateTextProperties("fontSize", size);
  };

  // Handle font family changes
  const handleFontFamilyChange = (family: string) => {
    setFontFamily(family);
    updateTextProperties("fontFamily", family);
  };

  // Handle shadow toggle
  const handleShadowToggle = (enabled: boolean) => {
    setTextShadow(enabled);
    updateTextProperties("shadow", enabled);
  };

  const handleSave = () => {
    if (!fabricCanvasRef.current) return;

    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: "jpeg",
        quality: 0.8,
      });

      onSave(dataUrl);
    } catch (err) {
      console.error("Error saving image:", err);
      setError("Failed to save the image. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) return;

    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: "jpeg",
        quality: 0.8,
      });

      const link = document.createElement("a");
      link.download = `wish-maker-${selectedImage.occasion}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading image:", err);
      setError("Failed to download the image. Please try again.");
    }
  };
  if (error) {
    return (
      <div className="w-full text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg mb-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            This might be due to CORS restrictions or network issues. Try
            another image or refresh the page.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
            {" "}
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64 space-y-3">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <span className="text-gray-600 dark:text-gray-300">
                  Loading editor...
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  This may take a moment to load the image
                </span>
              </div>
            ) : (
              <div className="flex justify-center">
                <canvas ref={canvasRef} />
              </div>
            )}
          </div>

          <div className="flex space-x-2 justify-center mt-4 mb-8">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              disabled={loading}
            >
              Save
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={loading}
            >
              Download
            </button>
          </div>
        </div>

        <div className="lg:w-1/4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Text Settings
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Text Color
              </label>
              <div className="grid grid-cols-8 gap-1">
                {colorOptions.map((color) => (
                  <div
                    key={color}
                    className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                      textColor === color
                        ? "ring-2 ring-offset-2 ring-indigo-500"
                        : ""
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorChange(color)}
                  />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Size: {fontSize}px
              </label>
              <input
                type="range"
                min="12"
                max="72"
                value={fontSize}
                onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
                className="w-full"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Font Family
              </label>
              <select
                value={fontFamily}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                disabled={loading}
              >
                {fontOptions.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={textShadow}
                  onChange={(e) => handleShadowToggle(e.target.checked)}
                  className="mr-2"
                  disabled={loading}
                />
                Text Shadow
              </label>
            </div>

            <div className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              <p>Tips:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>Click and drag the text to position it</li>
                <li>Click the text to edit the content directly</li>
                <li>Use the corner handles to resize text</li>
                <li>Use rotation handle to rotate text</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
