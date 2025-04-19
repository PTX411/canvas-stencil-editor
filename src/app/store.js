import { configureStore } from '@reduxjs/toolkit';
import editorReducer from '../features/editor/editorSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    editor: editorReducer, // Add the editor slice reducer
  },
  // Middleware configuration can be added here if needed
});