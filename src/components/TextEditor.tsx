import React, { useEffect, useRef, useState } from "react";
import { OccasionImage, downloadImage } from "@/utils/imageService";
import dynamic from "next/dynamic";

// Dynamically import fabric to avoid SSR issues
const loadFabric = async () => {
  try {
    console.log("Attempting to load fabric.js module");
    const fabricModule = await import("fabric");
    console.log("Fabric module imported successfully");
    return fabricModule.default;
  } catch (error) {
    console.error("Error importing fabric.js module:", error);
    throw new Error(
      `Failed to load fabric.js: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
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
    let isMounted = true;

    const loadFabricLibrary = async () => {
      try {
        console.log("Loading fabric.js library");
        const fabricInstance = await loadFabric();
        if (isMounted) {
          console.log("Fabric.js loaded successfully");
          setFabric(fabricInstance);
        }
      } catch (err) {
        console.error("Failed to load fabric.js:", err);
        if (isMounted) {
          setError("Failed to load the editor. Please try again.");
          setLoading(false);
        }
      }
    };

    loadFabricLibrary();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Initialize canvas with fabric.js when it's loaded
  useEffect(() => {
    console.log(
      "[TextEditor DEBUG] Canvas useEffect triggered. Fabric loaded:",
      !!fabric,
      "SelectedImage fullUrl:",
      selectedImage?.fullUrl
    );

    if (!fabric || !canvasRef.current) {
      console.log(
        "[TextEditor DEBUG] Canvas useEffect: fabric or canvasRef not ready, returning."
      );
      return;
    }
    if (!selectedImage?.fullUrl) {
      console.log(
        "[TextEditor DEBUG] Canvas useEffect: selectedImage.fullUrl is missing, returning."
      );
      // Optionally, set an error or loading false if this state is unexpected
      // setError("No image selected to load.");
      // setLoading(false);
      return;
    }

    let loadingTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;

    const setupCanvas = async () => {
      console.log(
        `[TextEditor DEBUG] setupCanvas: Starting. Image URL: ${selectedImage.fullUrl}`
      );
      try {
        setLoading(true);
        setError(null); // Clear previous specific errors

        loadingTimeout = setTimeout(() => {
          console.log(
            "[TextEditor DEBUG] setupCanvas: UI Loading timeout (5s) fired."
          );
          if (isMounted && loading && !error) {
            // Check 'loading' to see if still in initial loading phase
            setError(
              "Loading is taking longer than expected, but we're still trying. Please wait..."
            );
          }
        }, 5000);

        console.log(
          `[TextEditor DEBUG] setupCanvas: Initializing fabric.Canvas for image: ${selectedImage.fullUrl}`
        );
        // Ensure existing canvas is disposed if any (though ref.current should handle this)
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
        }
        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
          backgroundColor: "#f0f0f0",
          preserveObjectStacking: true,
        });

        if (!isMounted) {
          console.log(
            "[TextEditor DEBUG] setupCanvas: Component unmounted during fabric.Canvas init. Disposing."
          );
          fabricCanvas.dispose();
          return;
        }
        fabricCanvasRef.current = fabricCanvas;

        console.log(
          `[TextEditor DEBUG] setupCanvas: Attempting to download primary image: ${selectedImage.fullUrl}`
        );
        let img: HTMLImageElement;
        try {
          img = await downloadImage(selectedImage.fullUrl);
          console.log(
            "[TextEditor DEBUG] setupCanvas: Primary image downloaded successfully."
          );
        } catch (imgError) {
          console.error(
            "[TextEditor DEBUG] setupCanvas: Error downloading primary image:",
            imgError
          );
          if (selectedImage.fullUrl.includes("placehold.co")) {
            console.error(
              "[TextEditor DEBUG] setupCanvas: Primary image (which was a placeholder) failed. Re-throwing error."
            );
            throw imgError; // Re-throw if primary was already a placeholder and failed
          }

          console.log(
            "[TextEditor DEBUG] setupCanvas: Attempting to download placeholder image due to primary image failure."
          );
          const placeholderSize = 600;
          // Using a slightly different text for fallback to distinguish in network/placehold.co
          const placeholderUrl = `https://placehold.co/${placeholderSize}x${placeholderSize}?text=${selectedImage.occasion}_fallback`;
          try {
            img = await downloadImage(placeholderUrl);
            console.log(
              "[TextEditor DEBUG] setupCanvas: Placeholder image downloaded successfully."
            );
          } catch (placeholderError) {
            console.error(
              "[TextEditor DEBUG] setupCanvas: Error downloading placeholder image:",
              placeholderError
            );
            throw placeholderError; // This error will be caught by the outer catch
          }
        }

        if (!isMounted) {
          console.log(
            "[TextEditor DEBUG] setupCanvas: Component unmounted after image download. Disposing canvas."
          );
          fabricCanvas.dispose();
          return;
        }
        console.log(
          "[TextEditor DEBUG] setupCanvas: Image obtained. Proceeding to add to canvas."
        );

        const fabricImage = new fabric.Image(img, {
          selectable: false,
          evented: false,
        });

        const canvasWidth = Math.min(window.innerWidth - 40, 600); // Or your desired max width
        const scaleFactor = canvasWidth / img.width;
        const canvasHeight = img.height * scaleFactor;

        fabricCanvas.setWidth(canvasWidth);
        fabricCanvas.setHeight(canvasHeight);
        fabricImage.scaleToWidth(canvasWidth);
        fabricCanvas.add(fabricImage);

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
        fabricCanvas.renderAll();
        console.log(
          "[TextEditor DEBUG] setupCanvas: Canvas setup complete, image and text added."
        );
      } catch (error: any) {
        console.error(
          "[TextEditor DEBUG] setupCanvas: Error during canvas setup:",
          error
        );
        if (isMounted) {
          setError(
            `Failed to setup the editor: ${
              error instanceof Error ? error.message : String(error) // Use String(error) for safety
            }. Please try another image.`
          );
        }
      } finally {
        console.log(
          "[TextEditor DEBUG] setupCanvas: Entering finally block. isMounted:",
          isMounted
        );
        if (loadingTimeout) {
          clearTimeout(loadingTimeout);
        }
        if (isMounted) {
          console.log(
            "[TextEditor DEBUG] setupCanvas: Calling setLoading(false) in finally block."
          );
          setLoading(false);
        } else {
          console.log(
            "[TextEditor DEBUG] setupCanvas: Component not mounted, setLoading(false) skipped in finally block."
          );
        }
      }
    };

    setupCanvas();

    return () => {
      console.log(
        "[TextEditor DEBUG] Canvas useEffect cleanup. Tearing down. isMounted was true, now false."
      );
      isMounted = false;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
      if (fabricCanvasRef.current) {
        console.log("[TextEditor DEBUG] Disposing fabric canvas from cleanup.");
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [
    fabric,
    selectedImage, // Changed to depend on the whole selectedImage object
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
    if (!fabricCanvasRef.current) {
      setError("Editor not ready. Please try again.");
      return;
    }

    try {
      // Set a maximum dimensions for the saved image to avoid memory issues
      const MAX_DIMENSION = 2048;
      const canvas = fabricCanvasRef.current.getElement();
      const width = Math.min(canvas.width, MAX_DIMENSION);
      const height = Math.min(canvas.height, MAX_DIMENSION);
      const scaleFactor = Math.min(
        1,
        MAX_DIMENSION / Math.max(canvas.width, canvas.height)
      );

      console.log(
        `Saving canvas with dimensions: ${width}x${height}, scale factor: ${scaleFactor}`
      );

      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: "jpeg",
        quality: 0.85,
        width: width * scaleFactor,
        height: height * scaleFactor,
      });

      onSave(dataUrl);
    } catch (err) {
      console.error("Error saving image:", err);
      setError(
        `Failed to save the image: ${
          err instanceof Error ? err.message : "Unknown error"
        }. Please try again.`
      );
    }
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) {
      setError("Editor not ready. Please try again.");
      return;
    }

    try {
      // Set a maximum dimensions for the downloaded image to avoid memory issues
      const MAX_DIMENSION = 2048;
      const canvas = fabricCanvasRef.current.getElement();
      const width = Math.min(canvas.width, MAX_DIMENSION);
      const height = Math.min(canvas.height, MAX_DIMENSION);
      const scaleFactor = Math.min(
        1,
        MAX_DIMENSION / Math.max(canvas.width, canvas.height)
      );

      console.log(
        `Downloading canvas with dimensions: ${width}x${height}, scale factor: ${scaleFactor}`
      );

      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: "jpeg",
        quality: 0.85,
        width: width * scaleFactor,
        height: height * scaleFactor,
      });

      const link = document.createElement("a");
      link.download = `wish-maker-${selectedImage.occasion}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading image:", err);
      setError(
        `Failed to download the image: ${
          err instanceof Error ? err.message : "Unknown error"
        }. Please try again.`
      );
    }
  };
  if (error) {
    return (
      <div className="w-full text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Image Editor Issue
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-2">
            <p>This might be due to one of the following reasons:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>CORS restrictions preventing image loading</li>
              <li>Network connectivity issues</li>
              <li>The image format may not be supported</li>
              <li>Browser memory limitations for large images</li>
            </ul>
            <p className="mt-3 font-medium">
              Please try selecting a different image or refreshing the page.
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go Back and Try Again
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
              <div className="flex flex-col justify-center items-center h-80 space-y-4 p-6">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Loading image editor...
                </span>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  <p>
                    This may take a few moments depending on image size and
                    network speed.
                  </p>
                  <p className="mt-2">
                    If loading takes too long, try clicking "Back" and selecting
                    a different image.
                  </p>
                </div>
                {error && (
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm rounded-lg max-w-sm text-center">
                    {error}
                  </div>
                )}
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
