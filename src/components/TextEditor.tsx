import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { OccasionImage, downloadImage } from "@/utils/imageService";
import dynamic from "next/dynamic";

// Dynamically import fabric to avoid SSR issues
const loadFabric = async () => {
  try {
    console.log("Attempting to load fabric.js module (v2)");
    const fabricModule = await import("fabric");
    console.log("Fabric module imported. Keys:", Object.keys(fabricModule));

    let fabricInstance = fabricModule.default;

    // If fabric.default doesn't seem to be it (e.g., no Canvas constructor),
    // and the module itself has Canvas, then use the module directly.
    if (
      !(fabricInstance && typeof fabricInstance.Canvas === "function") &&
      fabricModule &&
      typeof (fabricModule as any).Canvas === "function"
    ) {
      console.log(
        "fabricModule.default didn't have .Canvas, trying fabricModule itself."
      );
      fabricInstance = fabricModule as any; // Use the module itself
    }

    if (!(fabricInstance && typeof fabricInstance.Canvas === "function")) {
      console.error(
        "Failed to resolve fabric instance with a Canvas constructor.",
        fabricInstance
      );
      throw new Error(
        "Failed to resolve fabric instance with a Canvas constructor."
      );
    }

    console.log("Resolved fabric instance successfully (v2).");
    return fabricInstance;
  } catch (error) {
    console.error("Error importing/resolving fabric.js module (v2):", error);
    throw new Error(
      `Failed to load fabric.js (v2): ${
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
    console.log("[FabricLoaderEffect] Initializing fabric load.");
    loadFabric()
      .then((fabricInstance) => {
        if (isMounted) {
          console.log(
            "[FabricLoaderEffect] Fabric.js loaded successfully, setting fabric state."
          );
          setFabric(fabricInstance);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[FabricLoaderEffect] Failed to load fabric.js:", err);
          setError(
            "CRITICAL: Editor libraries failed to load. Please refresh."
          );
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Diagnostic layout effect for canvasRef
  useLayoutEffect(() => {
    console.log(
      `[TextEditor LayoutEffect] After DOM mutation - loading: ${loading}, canvasRef.current populated: ${!!canvasRef.current}`
    );
  }, [loading]);

  // Initialize canvas with fabric.js when it's loaded AND selectedImage changes
  useEffect(() => {
    let isCanvasSetupMounted = true;
    let imageLoadingTimeout: NodeJS.Timeout | null = null;

    console.log(
      `[CanvasSetupEffect] Triggered. Fabric ready: ${!!(
        fabric && fabric.Canvas
      )}, Image selected: ${!!selectedImage?.fullUrl}, Current loading state: ${loading}, Canvas ref available: ${!!canvasRef.current}`
    );

    if (!fabric) {
      console.log("[CanvasSetupEffect] Fabric not loaded yet. Returning.");
      return;
    }

    if (!selectedImage?.fullUrl) {
      console.log(
        "[CanvasSetupEffect] Fabric loaded, but no image selected (e.g., on refresh or direct nav). Hiding main loader, showing prompt."
      );
      setLoading(false);
      setError(
        "No image selected for editing. Please go back and choose an image."
      );
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
      return;
    }

    if (loading) {
      console.log(
        "[CanvasSetupEffect] Fabric & image ready. Main 'loading' is true. Setting to false to render canvas element."
      );
      setLoading(false);
      return;
    }

    if (!canvasRef.current) {
      console.error(
        "[CanvasSetupEffect] CRITICAL: Fabric, image selected, loading=false, BUT canvasRef.current is NULL."
      );
      setError(
        "Editor canvas could not be initialized. Please try refreshing."
      );
      return;
    }

    console.log(
      "[CanvasSetupEffect] All prerequisites met. Proceeding to _setupFabricCanvas."
    );

    const _setupFabricCanvas = async () => {
      console.log(
        `[_setupFabricCanvas] Starting for image: ${selectedImage.fullUrl}`
      );
      setError(null);

      const editorContentLoadingElement = document.getElementById(
        "editor-content-loading"
      );
      if (editorContentLoadingElement)
        editorContentLoadingElement.style.display = "flex";

      imageLoadingTimeout = setTimeout(() => {
        if (isCanvasSetupMounted) {
          console.warn(
            "[_setupFabricCanvas] Image loading seems to be taking a while..."
          );
        }
      }, 7000);

      try {
        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.dispose();
          fabricCanvasRef.current = null;
        }

        const newCanvas = new fabric.Canvas(canvasRef.current, {
          backgroundColor: "#f0f0f0",
          preserveObjectStacking: true,
        });
        if (!isCanvasSetupMounted) {
          newCanvas.dispose();
          return;
        }
        fabricCanvasRef.current = newCanvas;

        console.log(
          `[_setupFabricCanvas] Downloading image via imageService: ${selectedImage.fullUrl}`
        );
        const imgHtmlElement = await downloadImage(selectedImage.fullUrl);
        if (!isCanvasSetupMounted) {
          newCanvas.dispose();
          return;
        }
        console.log("[_setupFabricCanvas] Image downloaded successfully.");

        const fabricImage = new fabric.Image(imgHtmlElement, {
          selectable: false,
          evented: false,
        });

        const MAX_CANVAS_WIDTH = 600;
        const canvasWidth = Math.min(window.innerWidth - 40, MAX_CANVAS_WIDTH);
        const scaleFactor = canvasWidth / imgHtmlElement.width;
        const canvasHeight = imgHtmlElement.height * scaleFactor;

        newCanvas.setWidth(canvasWidth);
        newCanvas.setHeight(canvasHeight);
        fabricImage.scaleToWidth(canvasWidth);
        newCanvas.add(fabricImage);

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
        newCanvas.add(text);
        newCanvas.setActiveObject(text);
        newCanvas.renderAll();
        console.log("[_setupFabricCanvas] Canvas setup complete.");
      } catch (err: any) {
        if (isCanvasSetupMounted) {
          console.error("[_setupFabricCanvas] Error during canvas setup:", err);
          setError(`Failed to load image into editor: ${err.message}.`);
        }
      } finally {
        if (isCanvasSetupMounted) {
          console.log("[_setupFabricCanvas] Reached finally block.");
          if (imageLoadingTimeout) clearTimeout(imageLoadingTimeout);
          if (editorContentLoadingElement)
            editorContentLoadingElement.style.display = "none";
        }
      }
    };

    _setupFabricCanvas();

    return () => {
      isCanvasSetupMounted = false;
      if (imageLoadingTimeout) clearTimeout(imageLoadingTimeout);
      console.log(
        "[CanvasSetupEffect] Cleanup. Disposing fabric canvas if it exists."
      );
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, [
    fabric,
    selectedImage,
    loading,
    wish,
    fontSize,
    fontFamily,
    textColor,
    textShadow,
  ]);

  // Apply changes when text properties change
  const updateTextProperties = (property: string, value: any) => {
    if (!fabricCanvasRef.current || !fabricCanvasRef.current.getActiveObject())
      return;
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
      setError("Canvas not ready for saving.");
      return;
    }

    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: "jpeg",
        quality: 0.85,
      });
      onSave(dataUrl);
    } catch (err) {
      console.error("Error saving image:", err);
      setError("Failed to save image.");
    }
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) {
      setError("Canvas not ready for download.");
      return;
    }

    try {
      const dataUrl = fabricCanvasRef.current.toDataURL({
        format: "jpeg",
        quality: 0.85,
      });
      const link = document.createElement("a");
      link.download = `wish-maker-${selectedImage?.occasion || "image"}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading image:", err);
      setError("Failed to download image.");
    }
  };

  if (error && !fabric && !fabricCanvasRef.current) {
    return (
      <div className="w-full text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            Editor Initialization Failed
          </h3>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-3/4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4 min-h-[400px]">
            {loading ? (
              <div
                id="editor-initial-loading"
                className="flex flex-col justify-center items-center h-80 space-y-4 p-6"
              >
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  Loading editor components...
                </span>
                <div className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  <p>Initializing Fabric.js and preparing canvas.</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col justify-center items-center h-80 space-y-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-md">
                <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
                  Image Editor Message
                </h3>
                <p className="text-red-600 dark:text-red-400 text-center">
                  {error}
                </p>
                <button
                  onClick={onBack}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Go Back
                </button>
              </div>
            ) : (
              <div className="flex justify-center items-center relative min-h-[300px]">
                <div
                  id="editor-content-loading"
                  className="absolute inset-0 flex flex-col justify-center items-center h-full w-full bg-white/80 dark:bg-gray-800/80 z-10"
                  style={{ display: "none" }}
                >
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
                  <span className="text-gray-600 dark:text-gray-300 font-medium mt-3">
                    Loading image...
                  </span>
                </div>
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
            {!loading && !error && fabricCanvasRef.current && (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download
                </button>
              </>
            )}
          </div>
        </div>
        <div className="lg:w-1/4">
          <div
            className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 ${
              loading || error || !fabricCanvasRef.current
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
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
