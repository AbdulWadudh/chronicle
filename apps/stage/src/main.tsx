import "@fontsource-variable/plus-jakarta-sans";
import "./global.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppRoutes } from "~/routes";

const container = document.getElementById("root");
if (container === null) throw new Error("index.html is missing the #root element.");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
);
