import React from 'react';
import StencilEditor from './components/StencilEditor';
import './App.css'; // Optional: for app-specific styling

function App() {
  return (
    <div className="App">
      <h1>React Fabric.js Stencil Editor</h1>
      {/* Render the main editor component */}
      <StencilEditor />
    </div>
  );
}

export default App;