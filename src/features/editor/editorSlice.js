import { createSlice } from '@reduxjs/toolkit';

// Initial state for the editor
const initialState = {
  imageUrl: null,       // URL of the uploaded image
  imageConfig: {        // Configuration of the image within the stencil
    scale: 1,
    left: 0,
    top: 0,
  },
  initialImageConfig: null, // Store initial config for reset
  stencil: {            // Define stencil properties (example: rounded rect)
    width: 300,
    height: 400,
    rx: 30, // corner radius X
    ry: 30, // corner radius Y
    fill: 'transparent', // Make stencil transparent
    stroke: '#ccc',      // Border color
    strokeWidth: 2,
    // Position will be calculated (e.g., center of canvas)
  }
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    // Action to set the uploaded image URL
    setImageUrl: (state, action) => {
      state.imageUrl = action.payload;
      // Reset config when new image is loaded
      state.imageConfig = { ...initialState.imageConfig };
      state.initialImageConfig = null; // Clear initial config
    },
    // Action to set the image's configuration (scale, position)
    setImageConfig: (state, action) => {
      state.imageConfig = { ...state.imageConfig, ...action.payload };
    },
    // Action to store the initial configuration after image is placed
    setInitialImageConfig: (state, action) => {
       if (!state.initialImageConfig) { // Only set once per image load
           state.initialImageConfig = action.payload;
       }
       state.imageConfig = action.payload; // Also set current config initially
    },
    // Action to reset the image to its initial state
    resetImage: (state) => {
      if (state.initialImageConfig) {
        state.imageConfig = state.initialImageConfig;
      }
    },
    // Action to update only the scale
    setImageScale: (state, action) => {
        state.imageConfig.scale = action.payload;
    },
     // Action to update only the position
    setImagePosition: (state, action) => {
        state.imageConfig.left = action.payload.left;
        state.imageConfig.top = action.payload.top;
    }
  },
});

// Export actions
export const {
    setImageUrl,
    setImageConfig,
    setInitialImageConfig,
    resetImage,
    setImageScale,
    setImagePosition
} = editorSlice.actions;

// Export reducer
export default editorSlice.reducer;