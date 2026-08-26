import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FloatingButton } from "./FloatingButton";
import { InspectorPanel } from "./InspectorPanel";
import inspectorStyles from "./inspector.css?inline";
import { mockReport } from "../../data/mockReport";
import type { AssetInspectionReport } from "../../types/assetReport";

export function AssetInspector() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [report, setReport] = useState<AssetInspectionReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/__dev-asset-inspector/report?t=${Date.now()}`,
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch report from server (HTTP ${response.status})`,
        );
      }

      const data = (await response.json()) as AssetInspectionReport;
      setReport(data);
    } catch (err: any) {
      console.warn("[dev-asset-inspector] Failed to fetch live report:", err);
      setError(
        err?.message ||
          "Unable to connect to dev server. Ensure assetInspectorPlugin() is registered in your vite.config.ts.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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

  useEffect(() => {
    fetchReport();
  }, []);

  const [isClosing, setIsClosing] = useState(false);

  const handleOpen = () => {
    setIsClosing(false);
    setIsOpen(true);
    if (!report && !isLoading) {
      fetchReport();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setIsMaximized(false);
    }, 200);
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
                  report={report}
                  isLoading={isLoading}
                  error={error}
                  onRefresh={fetchReport}
                  onUseMockData={() => {
                    setReport(mockReport);
                    setError(null);
                  }}
                  maximized={isMaximized}
                  isClosing={isClosing}
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
