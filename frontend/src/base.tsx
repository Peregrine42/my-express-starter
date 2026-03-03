import ReactDOM from "react-dom/client";
import { JSX } from "react";
import "../css/base.css";

export function page(EntryPoint: () => JSX.Element) {
  return () => {
    const container = document.getElementById("root");
    const root = ReactDOM.createRoot(container!);
    root.render(<EntryPoint />);
  };
}
