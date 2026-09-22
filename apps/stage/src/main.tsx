import "@fontsource-variable/plus-jakarta-sans";
import "./global.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { queryClient } from "~/lib/queryClient";
import { AppRoutes } from "~/routes";

const container = document.getElementById("root");
if (container === null) throw new Error("index.html is missing the #root element.");

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
