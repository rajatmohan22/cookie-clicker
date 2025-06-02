import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { NickNamePopup } from "./components/NickNamePopup.jsx";

createRoot(document.getElementById("root")).render(
  <>
    <App />
  </>
);
