import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FloatingButton } from "./FloatingButton";
import { InspectorPanel } from "./InspectorPanel";
import inspectorStyles from "./inspector.css?inline";
import { mockReport } from "../../data/mockReport";

export function AssetInspector() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: "open" });

    let styleElement = shadowRoot.querySelector<HTMLStyleElement>(
      "[data-asset-inspector-styles]",
    );

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.setAttribute("data-asset-inspector-styles", "");
      styleElement.textContent = inspectorStyles;
      shadowRoot.appendChild(styleElement);
    }

    let mountPoint = shadowRoot.querySelector<HTMLDivElement>(
      "[data-asset-inspector-root]",
    );

    if (!mountPoint) {
      mountPoint = document.createElement("div");
      mountPoint.setAttribute("data-asset-inspector-root", "");
      shadowRoot.appendChild(mountPoint);
    }

    setContainer(mountPoint);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMaximized(false);
  };

  const handleToggleMaximize = () => {
    setIsMaximized((current) => !current);
  };

  return (
    <div ref={hostRef} data-asset-inspector-host="">
      {container
        ? createPortal(
            <>
              {!isOpen && <FloatingButton onClick={handleOpen} />}

              {isOpen && (
                <InspectorPanel
                  report={mockReport}
                  maximized={isMaximized}
                  onClose={handleClose}
                  onToggleMaximize={handleToggleMaximize}
                />
              )}
            </>,
            container,
          )
        : null}
    </div>
  );
}
