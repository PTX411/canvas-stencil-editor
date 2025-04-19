import React, { useRef, useEffect, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useSelector, useDispatch } from 'react-redux';
import {
    setImageUrl,
    setImageConfig,
    setInitialImageConfig,
    resetImage,
    setImageScale,
    setImagePosition
} from '../features/editor/editorSlice';

// Basic styling for the component
const editorStyle = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '15px',
    maxWidth: '800px', // Limit width
    margin: '20px auto', // Center component
    backgroundColor: '#f9f9f9',
};

const canvasContainerStyle = {
    border: '1px dashed #aaa',
    marginBottom: '15px',
    position: 'relative', // Needed for potential overlays or absolute positioning
    // Make container responsive (aspect ratio can be adjusted)
    width: '100%',
    paddingBottom: '75%', // Example: 4:3 aspect ratio (adjust as needed)
    height: 0, // Height is controlled by padding-bottom
    overflow: 'hidden', // Hide overflow
};

const canvasStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
};


const controlsStyle = {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap', // Allow wrapping on smaller screens
    justifyContent: 'center',
};

const buttonStyle = {
    padding: '8px 15px',
    cursor: 'pointer',
    borderRadius: '5px',
    border: '1px solid #007bff',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '14px',
};

const fileInputStyle = {
     ...buttonStyle, // Inherit button styling
     display: 'inline-block', // Make label behave like button
     position: 'relative',
     overflow: 'hidden',
     backgroundColor: '#6c757d',
     borderColor: '#6c757d',
};

const hiddenInput = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
};


function StencilEditor() {
    // Refs for canvas element and Fabric.js instance
    const canvasEl = useRef(null);
    const fabricCanvasRef = useRef(null);
    const imageRef = useRef(null); // Ref to store the Fabric image object
    const stencilRef = useRef(null); // Ref to store the Fabric stencil object
    const containerRef = useRef(null); // Ref for the canvas container div

    // Redux state and dispatch
    const dispatch = useDispatch();
    const { imageUrl, imageConfig, stencil } = useSelector((state) => state.editor);

    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // --- Define handleObjectMoving here, outside useEffect ---
    // This function constrains the image movement within the stencil bounds
    const handleObjectMoving = useCallback((options) => {
        // Use useCallback to memoize the function if needed, though dependencies might be complex
        // For simplicity now, ensure it uses current refs directly.
        if (!imageRef.current || !stencilRef.current || options.target !== imageRef.current) return;

        const img = options.target;
        const stencil = stencilRef.current;

        // Calculate boundaries based on stencil and scaled image dimensions
        const scaledImgWidth = img.getScaledWidth();
        const scaledImgHeight = img.getScaledHeight();
        const stencilWidth = stencil.getScaledWidth();
        const stencilHeight = stencil.getScaledHeight();

        // Calculate stencil bounds using center origin
        const stencilLeft = stencil.left - stencilWidth / 2;
        const stencilTop = stencil.top - stencilHeight / 2;
        const stencilRight = stencilLeft + stencilWidth;
        const stencilBottom = stencilTop + stencilHeight;

        // Calculate image bounds relative to its center origin
        const imgBoundLeft = img.left - scaledImgWidth / 2;
        const imgBoundTop = img.top - scaledImgHeight / 2;
        const imgBoundRight = img.left + scaledImgWidth / 2;
        const imgBoundBottom = img.top + scaledImgHeight / 2;

        let newLeft = img.left;
        let newTop = img.top;

        // Constrain left/right movement
        if (imgBoundLeft > stencilLeft) {
            newLeft = stencilLeft + scaledImgWidth / 2;
        }
        if (imgBoundRight < stencilRight) {
            newLeft = stencilRight - scaledImgWidth / 2;
        }

        // Constrain top/bottom movement
        if (imgBoundTop > stencilTop) {
            newTop = stencilTop + scaledImgHeight / 2;
        }
        if (imgBoundBottom < stencilBottom) {
            newTop = stencilBottom - scaledImgHeight / 2;
        }

        // Apply constrained position only if it changed
        if (newLeft !== img.left || newTop !== img.top) {
             img.set({
                 left: newLeft,
                 top: newTop,
             });
             img.setCoords(); // Update coordinates after setting position
        }
    }, []); // Dependency array for useCallback - empty for now, relies on refs being stable


    // --- Canvas Initialization and Resizing ---
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initialize canvas size based on container
        const updateCanvasSize = () => {
            const { clientWidth, clientHeight } = container;
            setCanvasSize({ width: clientWidth, height: clientHeight });

            if (fabricCanvasRef.current) {
                console.log(`Resizing canvas to: ${clientWidth}x${clientHeight}`);
                fabricCanvasRef.current.setWidth(clientWidth);
                fabricCanvasRef.current.setHeight(clientHeight);
                // Recenter stencil and image on resize
                centerStencilAndImage(); // Call the centering function
                fabricCanvasRef.current.renderAll();
            }
        };

        // Initial size calculation
        updateCanvasSize();

        // Initialize Fabric canvas
        if (!fabricCanvasRef.current) {
             console.log("Initializing Fabric canvas...");
             const canvas = new fabric.Canvas(canvasEl.current, {
                 backgroundColor: '#eee', // Canvas background
                 // Optimization flags (optional)
                 // preserveObjectStacking: true,
                 // renderOnAddRemove: false,
             });
             fabricCanvasRef.current = canvas;
        }


        // Add resize listener
        const resizeObserver = new ResizeObserver(updateCanvasSize);
        resizeObserver.observe(container);

        // Cleanup function
        return () => {
            resizeObserver.unobserve(container);
            // Check if canvas exists before disposing
            if (fabricCanvasRef.current) {
                 console.log("Disposing Fabric canvas...");
                 fabricCanvasRef.current.dispose();
                 fabricCanvasRef.current = null; // Clear ref
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only on mount and unmount - centerStencilAndImage is memoized or defined outside

    // --- Stencil Creation and Centering ---
    // Use useCallback to memoize this function if it's used in dependency arrays
    const centerStencilAndImage = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !canvas.width || !canvas.height) return;

        const center = canvas.getCenter();

        // Create/Update Stencil (Photo Frame Mask)
        if (!stencilRef.current) {
            console.log("Creating stencil shape...");
            const stencilObj = new fabric.Rect({
                ...stencil, // Properties from Redux state
                left: center.left,
                top: center.top,
                originX: 'center',
                originY: 'center',
                selectable: false, // Make stencil non-interactive
                evented: false,
                absolutePositioned: true, // Crucial for clipPath positioning
            });
            stencilRef.current = stencilObj;
            // Add stencil to canvas visually (optional, useful for border)
            // Ensure it's added only once or handled appropriately if re-added
            if (!canvas.getObjects().includes(stencilObj)) {
                 canvas.add(stencilObj);
            }
            canvas.renderAll(); // Render stencil border if added
        } else {
             console.log("Updating stencil position...");
             stencilRef.current.set({
                 left: center.left,
                 top: center.top,
             });
             stencilRef.current.setCoords(); // Update controls/coordinates
        }

        // Update image position if it exists
        if (imageRef.current) {
            console.log("Updating image position relative to stencil...");
             // Re-apply clip path and center image initially if needed
             imageRef.current.set({
                left: center.left, // Keep image centered with stencil
                top: center.top,
                clipPath: stencilRef.current // Ensure clipPath is updated
             });
             imageRef.current.setCoords();
             // Re-check constraints after centering
             handleObjectMoving({ target: imageRef.current });
        }

        canvas.renderAll();

    // Include handleObjectMoving if it's memoized and needed here, otherwise rely on it being stable
    }, [stencil, handleObjectMoving]); // Depend on stencil config from Redux and the memoized moving handler


    // Effect to draw/center stencil when canvas size is ready
     useEffect(() => {
         if (fabricCanvasRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
             centerStencilAndImage();
         }
     }, [canvasSize, centerStencilAndImage]); // Rerun when size or the centering function changes


    // --- Image Loading and Placement ---
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        // Added stencilRef check here as it's needed for placement logic
        if (!canvas || !imageUrl || !stencilRef.current) return;

        // Remove previous image if it exists
        if (imageRef.current) {
            canvas.remove(imageRef.current);
            imageRef.current = null;
        }

        console.log("Loading image:", imageUrl);
        fabric.Image.fromURL(imageUrl, (img) => {
            // Check again in case component unmounted or refs became null
            if (!canvas || !stencilRef.current) return;

            console.log("Image loaded:", img.width, "x", img.height);
            const center = canvas.getCenter();

            // Calculate initial scale to fit the image within the stencil bounds
            const stencilWidth = stencilRef.current.getScaledWidth();
            const stencilHeight = stencilRef.current.getScaledHeight();

            const scaleX = stencilWidth / img.width;
            const scaleY = stencilHeight / img.height;
            // Use 'cover' scaling: fill the stencil, potentially cropping the image
            const initialScale = Math.max(scaleX, scaleY);

            img.set({
                left: center.left,
                top: center.top,
                originX: 'center',
                originY: 'center',
                scaleX: initialScale,
                scaleY: initialScale,
                clipPath: stencilRef.current, // Apply the stencil as clipPath
                selectable: true,
                evented: true,
            });

            console.log("Adding image to canvas with initial scale:", initialScale);
            canvas.add(img);
            canvas.setActiveObject(img); // Make the newly added image active
            imageRef.current = img; // Store reference to the image object

            // Store initial configuration in Redux for reset functionality
            const initialConfig = {
                scale: initialScale,
                left: center.left,
                top: center.top,
            };
            dispatch(setInitialImageConfig(initialConfig));

            canvas.renderAll();
        }, { crossOrigin: 'anonymous' }); // Needed for images from other domains if using toDataURL later

    // Include dispatch in dependencies
    }, [imageUrl, canvasSize, dispatch]); // Rerun when image URL or canvas size changes


    // --- Image Manipulation Event Handlers Setup ---
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Define handler for object modification end (e.g., after drag/scale)
        const handleObjectModified = (options) => {
            // Update Redux state after movement/scaling is finished
            if (options.target === imageRef.current) {
                console.log("Object modified, updating Redux state");
                // Dispatch the final position and scale
                dispatch(setImageConfig({
                    scale: options.target.scaleX, // Assuming uniform scaling
                    left: options.target.left,
                    top: options.target.top,
                }));
            }
        };

        // Define handler for mouse wheel zoom
        const handleMouseWheel = (opt) => {
            const delta = opt.e.deltaY; // Wheel scroll amount
            const zoomFactor = 0.99; // Zoom out factor
            const zoomFactorIn = 1.01; // Zoom in factor

            const img = imageRef.current;
            // Check if image exists and if the mouse is over the image
            if (!img || !stencilRef.current || !canvas.findTarget(opt.e, true) || canvas.findTarget(opt.e, true) !== img) {
                 return; // Only zoom if mouse is over the target image
            }

            let newScale = img.scaleX; // Assuming uniform scale

            if (delta > 0) { // Zoom out
                newScale *= zoomFactor;
            } else { // Zoom in
                newScale *= zoomFactorIn;
            }

             // --- Minimum Zoom Constraint ---
             const stencilWidth = stencilRef.current.getScaledWidth();
             const stencilHeight = stencilRef.current.getScaledHeight();
             // Ensure img.width/height are available (image should be loaded)
             const minScaleX = img.width ? stencilWidth / img.width : 1;
             const minScaleY = img.height ? stencilHeight / img.height : 1;
             const minScale = Math.max(minScaleX, minScaleY);

             if (newScale < minScale) {
                 newScale = minScale;
             }
             // --- End Minimum Zoom Constraint ---

            img.scale(newScale); // Scale the image object directly

            // Adjust position after zoom to keep image covering stencil
            handleObjectMoving({ target: img }); // Use the function defined outside

            dispatch(setImageScale(newScale)); // Update Redux scale state immediately

            opt.e.preventDefault(); // Prevent page scrolling
            opt.e.stopPropagation(); // Stop event bubbling
            canvas.requestRenderAll(); // Re-render the canvas
        };


        // Attach event listeners using the handlers defined in the component scope
        canvas.on('object:moving', handleObjectMoving); // handleObjectMoving is now defined outside
        canvas.on('object:modified', handleObjectModified);
        canvas.on('mouse:wheel', handleMouseWheel);

        // Cleanup listeners on component unmount or dependency change
        return () => {
            if (canvas) { // Check if canvas still exists
                canvas.off('object:moving', handleObjectMoving);
                canvas.off('object:modified', handleObjectModified);
                canvas.off('mouse:wheel', handleMouseWheel);
            }
        };
    // Include dispatch and handleObjectMoving in dependencies
    }, [dispatch, handleObjectMoving]); // Re-attach if dispatch or the memoized moving handler changes


     // Effect to update Fabric image when Redux state changes (e.g., on reset)
     useEffect(() => {
         const img = imageRef.current;
         const canvas = fabricCanvasRef.current;
         if (img && canvas && stencilRef.current) { // Ensure stencilRef is also available
             // Only update if Fabric state differs significantly from Redux state
             const needsUpdate =
                 Math.abs(img.scaleX - imageConfig.scale) > 0.001 ||
                 Math.abs(img.left - imageConfig.left) > 0.001 ||
                 Math.abs(img.top - imageConfig.top) > 0.001;

             if (needsUpdate) {
                 console.log("Updating Fabric image from Redux state (e.g., after reset)");
                 img.set({
                     scaleX: imageConfig.scale,
                     scaleY: imageConfig.scale,
                     left: imageConfig.left,
                     top: imageConfig.top,
                 });
                 img.setCoords();
                 // Re-check constraints after programmatically setting state
                 handleObjectMoving({ target: img }); // Use the function defined outside
                 canvas.renderAll();
             }
         }
     // Include handleObjectMoving if it's memoized and needed here
     }, [imageConfig, handleObjectMoving]); // Listen to changes in imageConfig


    // --- Control Handlers ---
    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                dispatch(setImageUrl(e.target.result)); // Dispatch action with image data URL
            };
            reader.readAsDataURL(file);
        }
         // Reset file input value to allow uploading the same file again
         event.target.value = null;
    };

    const handleZoom = (factor) => {
        const img = imageRef.current;
        const canvas = fabricCanvasRef.current;
         // Ensure stencilRef is available for constraints check
         if (!img || !canvas || !stencilRef.current) return;

         let newScale = img.scaleX * factor;

         // Apply minimum zoom constraint
         const stencilWidth = stencilRef.current.getScaledWidth();
         const stencilHeight = stencilRef.current.getScaledHeight();
         // Ensure img.width/height are available
         const minScaleX = img.width ? stencilWidth / img.width : 1;
         const minScaleY = img.height ? stencilHeight / img.height : 1;
         const minScale = Math.max(minScaleX, minScaleY);
         if (newScale < minScale) {
             newScale = minScale;
         }

         img.scale(newScale);
         handleObjectMoving({ target: img }); // Re-check constraints using the function defined outside
         // Dispatch final state after modification
         dispatch(setImageConfig({
             scale: newScale,
             left: img.left,
             top: img.top
         }));
         canvas.renderAll();
    };

    const handleReset = () => {
        console.log("Reset button clicked");
        dispatch(resetImage()); // Dispatch reset action
    };


    return (
        <div style={editorStyle}>
            {/* Canvas Container */}
            <div ref={containerRef} style={canvasContainerStyle}>
                <canvas ref={canvasEl} style={canvasStyle} />
            </div>

            {/* Controls */}
            <div style={controlsStyle}>
                 {/* File Upload Button */}
                 <label style={fileInputStyle}>
                     Upload Image
                     <input
                         type="file"
                         accept="image/*"
                         onChange={handleImageUpload}
                         style={hiddenInput}
                     />
                 </label>

                {/* Zoom Buttons (only enable if image is loaded) */}
                <button
                    style={buttonStyle}
                    onClick={() => handleZoom(1.1)} // Zoom In
                    disabled={!imageUrl}
                >
                    Zoom In (+)
                </button>
                <button
                     style={buttonStyle}
                     onClick={() => handleZoom(0.9)} // Zoom Out
                     disabled={!imageUrl}
                 >
                     Zoom Out (-)
                 </button>

                 {/* Reset Button (only enable if image is loaded) */}
                <button
                    style={buttonStyle}
                    onClick={handleReset}
                    disabled={!imageUrl}
                >
                    Reset Image
                </button>
            </div>
        </div>
    );
}

export default StencilEditor;