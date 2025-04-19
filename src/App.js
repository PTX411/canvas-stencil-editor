// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
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