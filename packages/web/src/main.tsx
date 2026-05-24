import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./theme.css";

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element not found. Ensure index.html contains <div id='root'></div>.");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
