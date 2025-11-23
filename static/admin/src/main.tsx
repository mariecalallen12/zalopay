import { createRoot } from "react-dom/client";
import App from "./App";
import "./shared/index.css";
import { registerServiceWorker } from "./shared/lib/serviceWorker";

// Register service worker for PWA
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
