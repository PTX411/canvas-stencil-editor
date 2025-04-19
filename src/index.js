import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './app/store'; // Import the configured store
import App from './App';
import './index.css'; // Optional: for basic styling

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Provide the Redux store to the entire application */}
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);