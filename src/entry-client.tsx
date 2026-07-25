import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const router = getRouter();

// Keep structured data available to non-JavaScript crawlers while preventing
// duplicate schemas once the client-rendered Helmet tags take over.
document
  .querySelectorAll('script[data-prerendered-jsonld="true"]')
  .forEach((element) => element.remove());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
