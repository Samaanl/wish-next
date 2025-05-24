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
}

const TextEditor: React.FC<TextEditorProps> = ({
  wish,
  selectedImage,
  onBack,
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
  const [canvasReady, setCanvasReady] = useState(false);

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

        // Responsive canvas sizing for better mobile UI
        const isMobile = window.innerWidth < 768;
        const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

        let canvasWidth;
        if (isMobile) {
          // Mobile: Make canvas fill most of screen width but maintain square aspect ratio
          canvasWidth = Math.min(
            window.innerWidth - 32,
            window.innerHeight - 200
          );
        } else if (isTablet) {
          canvasWidth = Math.min(window.innerWidth * 0.6, 500);
        } else {
          canvasWidth = Math.min(window.innerWidth * 0.5, 600);
        }

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
        newCanvas.renderAll(); // Wait a moment to ensure everything is rendered before marking as ready
        setTimeout(() => {
          if (isCanvasSetupMounted) {
            setCanvasReady(true);
            // Don't reset setupAttempts here to avoid infinite loops
            console.log(
              "[_setupFabricCanvas] Canvas setup complete. Canvas ready for download."
            );
          }
        }, 500);
      } catch (err: any) {
        if (isCanvasSetupMounted) {
          console.error("[_setupFabricCanvas] Error during canvas setup:", err);
          // Track attempts locally within this execution to avoid state loops
          let currentAttempts = 0; // Start fresh for each setup attempt

          if (currentAttempts < 2) {
            currentAttempts++;
            console.log(
              `[_setupFabricCanvas] Retrying setup attempt ${
                currentAttempts + 1
              }/3`
            );
            // Retry after a short delay without updating state
            setTimeout(() => {
              if (isCanvasSetupMounted) {
                _setupFabricCanvas();
              }
            }, 1000);
          } else {
            console.error(
              "[_setupFabricCanvas] Max setup attempts reached. Enabling controls anyway."
            );
            setError(
              `Failed to load image into editor: ${err.message}. Controls are enabled for manual retry.`
            );
            setCanvasReady(true); // Enable controls even if setup failed
          }
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
      setCanvasReady(false);
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
    // Remove setupAttempts from dependencies to prevent infinite loops
  ]); // Fallback to enable controls if canvas setup is taking too long
  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (!canvasReady && !loading && !error) {
        console.warn(
          "[TextEditor] Canvas setup taking too long. Enabling controls as fallback."
        );
        setCanvasReady(true);
        setError(
          "Canvas setup had issues, but controls are enabled. You may need to refresh if text editing doesn't work properly."
        );
      }
    }, 10000); // 10 second fallback

    return () => clearTimeout(fallbackTimeout);
  }, [canvasReady, loading, error]);

  // Apply changes when text properties change
  const updateTextProperties = (property: string, value: any) => {
    if (!fabricCanvasRef.current) {
      console.log("Fabric canvas not ready, skipping text property update");
      return;
    }

    let activeObject = fabricCanvasRef.current.getActiveObject();
    if (!activeObject || activeObject.type !== "textbox") {
      // If no active object, try to find the text object
      const objects = fabricCanvasRef.current.getObjects();
      const textObject = objects.find((obj: any) => obj.type === "textbox");
      if (textObject) {
        fabricCanvasRef.current.setActiveObject(textObject);
        activeObject = textObject;
      } else {
        console.log("No text object found to update");
        return;
      }
    }

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
  const handleDownload = async () => {
    // Check if canvas and fabric are ready
    if (!fabricCanvasRef.current || !canvasReady || !fabric) {
      console.error("Canvas not ready for download:", {
        fabricCanvas: !!fabricCanvasRef.current,
        canvasReady,
        fabricLoaded: !!fabric,
      });
      setError(
        "Canvas not ready for download. Please wait for the editor to load completely."
      );
      return;
    }

    if (!selectedImage?.fullUrl) {
      setError("No image selected for download.");
      return;
    }

    try {
      console.log("Starting download process...");

      // Use fabric's built-in export functionality
      const fabricCanvas = fabricCanvasRef.current;

      // Export using fabric's toDataURL which handles scaling better
      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1.0,
        multiplier: 2, // Double resolution for better quality
      });

      // Create filename
      const filename = `wish-maker-${
        selectedImage?.occasion || "image"
      }-${Date.now()}.png`;

      // Use the simplest possible download method to avoid React conflicts
      // Create a temporary anchor element and trigger download
      const tempLink = document.createElement("a");
      tempLink.href = dataURL;
      tempLink.download = filename;

      // Add to document briefly, click, then remove immediately
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);

      console.log("Download completed successfully");
    } catch (err) {
      console.error("Error downloading image:", err);
      setError(
        `Failed to download image: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto">
          {/* Canvas Section */}
          <div className="xl:w-2/3 flex flex-col">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex-1">
              <div className="flex justify-center items-center">
                {loading ? (
                  <div
                    id="editor-initial-loading"
                    className="flex flex-col justify-center items-center min-h-[300px] space-y-4 p-6"
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
                  <div className="flex flex-col justify-center items-center min-h-[300px] space-y-4 p-6 bg-red-50 dark:bg-red-900/10 rounded-md">
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
                  <div className="relative w-full flex justify-center">
                    <div
                      id="editor-content-loading"
                      className="absolute inset-0 flex flex-col justify-center items-center bg-white/80 dark:bg-gray-800/80 z-10"
                      style={{ display: "none" }}
                    >
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-200 border-t-indigo-600"></div>
                      <span className="text-gray-600 dark:text-gray-300 font-medium mt-3">
                        Loading image...
                      </span>
                    </div>
                    <canvas
                      ref={canvasRef}
                      className="max-w-full h-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons - Desktop/Tablet */}
            <div className="hidden md:flex gap-3 justify-center mt-6">
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                ← Back{" "}
              </button>{" "}
              {!loading && !error && canvasReady && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                >
                  ⬇️ Download
                </button>
              )}
            </div>
          </div>

          {/* Controls Section */}
          <div className="xl:w-1/3">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${
                loading || error || !canvasReady
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                <span className="mr-2">🎨</span>
                Text Settings
              </h3>

              {/* Debug info when controls are disabled */}
              {(loading || error || !canvasReady) && (
                <div className="mb-6 p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg text-sm">
                  {" "}
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Controls disabled: Loading: {loading ? "Yes" : "No"}, Canvas
                    Ready: {canvasReady ? "Yes" : "No"}, Error:{" "}
                    {error ? "Yes" : "No"}
                  </p>
                  {error && (
                    <p className="text-red-600 dark:text-red-400 mt-2 text-xs">
                      {error}
                    </p>
                  )}{" "}
                  {!canvasReady && !loading && (
                    <button
                      onClick={() => {
                        // Reset states without triggering infinite loops
                        setError(null);
                        setCanvasReady(false);
                        setLoading(true);
                        // Don't update setupAttempts here
                      }}
                      className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 font-medium"
                    >
                      🔄 Retry Setup
                    </button>
                  )}
                </div>
              )}

              {/* Color picker with improved mobile experience */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  🎨 Text Color
                </label>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-all duration-200 ${
                        textColor === color
                          ? "ring-3 ring-offset-2 ring-indigo-500 shadow-lg"
                          : "hover:shadow-md"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorChange(color)}
                      aria-label={`Select color ${color}`}
                    />
                  ))}
                </div>
              </div>

              {/* Enhanced font size control */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  📏 Font Size: {fontSize}px
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() =>
                      handleFontSizeChange(Math.max(12, fontSize - 2))
                    }
                    className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-bold text-lg transition-colors"
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min="12"
                    max="72"
                    value={fontSize}
                    onChange={(e) =>
                      handleFontSizeChange(parseInt(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <button
                    onClick={() =>
                      handleFontSizeChange(Math.min(72, fontSize + 2))
                    }
                    className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-bold text-lg transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Enhanced font family selector */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  🔤 Font Family
                </label>
                <select
                  value={fontFamily}
                  onChange={(e) => handleFontFamilyChange(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                >
                  {fontOptions.map((font) => (
                    <option
                      key={font}
                      value={font}
                      style={{ fontFamily: font }}
                    >
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced shadow toggle */}
              <div className="mb-8">
                <label className="flex items-center text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={textShadow}
                    onChange={(e) => handleShadowToggle(e.target.checked)}
                    className="w-5 h-5 mr-3 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="mr-2">✨</span>
                  Text Shadow
                </label>
              </div>

              {/* Enhanced tips section */}
              <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-semibold mb-3 text-gray-700 dark:text-gray-300 flex items-center">
                  <span className="mr-2">💡</span>
                  Tips:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>Tap and drag text to reposition it on the image</li>
                  <li>Double-tap text to edit the content directly</li>
                  <li>Use corner handles to resize text</li>
                  <li>Use rotation handle to rotate text</li>
                  <li>Download gives you high-quality PNG output</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Action Bar - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 z-50">
        <div className="flex justify-center gap-3 max-w-sm mx-auto">
          <button
            onClick={onBack}
            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            ← Back{" "}
          </button>{" "}
          {!loading && !error && canvasReady && (
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              ⬇️ Download
            </button>
          )}
        </div>
        {/* Safe area for mobile devices */}
        <div className="h-4"></div>
      </div>

      {/* Spacer for mobile to prevent content being hidden behind fixed bar */}
      <div className="md:hidden h-24"></div>
    </div>
  );
};

export default TextEditor;
