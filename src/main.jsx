import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";
import ProvisionBle from "./ProvisionBle.jsx";

function Home() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Module64</h1>
      <p>Main app coming soon.</p>
      <p>
        Go to <a href="/provisioning">Provisioning</a>
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/provisioning" element={<ProvisionBle />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);