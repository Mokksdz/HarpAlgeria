"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, FileCode } from "lucide-react";

export default function ApiDocsPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Swagger UI from CDN
    const loadSwaggerUI = async () => {
      // Add Swagger UI CSS
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css";
      document.head.appendChild(link);

      // Add Swagger UI JS
      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js";
      script.onload = () => {
        // @ts-expect-error SwaggerUIBundle is loaded from CDN
        if (window.SwaggerUIBundle && containerRef.current) {
          // @ts-expect-error SwaggerUIBundle is loaded from CDN
          window.SwaggerUIBundle({
            url: "/api/docs",
            dom_id: "#swagger-ui",
            deepLinking: true,
            presets: [
              // @ts-expect-error SwaggerUIBundle is loaded from CDN
              window.SwaggerUIBundle.presets.apis,
              // @ts-expect-error SwaggerUIStandalonePreset is loaded from CDN
              window.SwaggerUIStandalonePreset,
            ],
            layout: "StandaloneLayout",
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            docExpansion: "list",
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
          });
        }
      };
      document.body.appendChild(script);

      // Add standalone preset
      const presetScript = document.createElement("script");
      presetScript.src =
        "https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js";
      document.body.appendChild(presetScript);
    };

    loadSwaggerUI();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileCode size={24} className="text-green-600" />
                  API Documentation
                </h1>
                <p className="text-sm text-gray-500">
                  HARP Accounting API - OpenAPI 3.1
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <ExternalLink size={16} />
                OpenAPI YAML
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div
        ref={containerRef}
        id="swagger-ui"
        className="swagger-ui-container"
      />

      {/* Custom styles for Swagger UI */}
      <style jsx global>{`
        .swagger-ui-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .swagger-ui .topbar {
          display: none;
        }

        .swagger-ui .info {
          margin: 20px 0;
        }

        .swagger-ui .info .title {
          font-size: 2rem;
          font-weight: 700;
        }

        .swagger-ui .scheme-container {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
        }

        .swagger-ui .opblock-tag {
          border-bottom: 1px solid #e5e7eb;
          font-size: 1.25rem;
        }

        .swagger-ui .opblock {
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-bottom: 10px;
        }

        .swagger-ui .opblock .opblock-summary {
          border-radius: 8px;
        }

        .swagger-ui .opblock.opblock-get .opblock-summary {
          border-color: #3b82f6;
        }

        .swagger-ui .opblock.opblock-get .opblock-summary-method {
          background: #3b82f6;
        }

        .swagger-ui .opblock.opblock-post .opblock-summary {
          border-color: #22c55e;
        }

        .swagger-ui .opblock.opblock-post .opblock-summary-method {
          background: #22c55e;
        }

        .swagger-ui .opblock.opblock-put .opblock-summary {
          border-color: #f59e0b;
        }

        .swagger-ui .opblock.opblock-put .opblock-summary-method {
          background: #f59e0b;
        }

        .swagger-ui .opblock.opblock-delete .opblock-summary {
          border-color: #ef4444;
        }

        .swagger-ui .opblock.opblock-delete .opblock-summary-method {
          background: #ef4444;
        }

        .swagger-ui .btn {
          border-radius: 6px;
        }

        .swagger-ui .btn.execute {
          background: #d97706;
          border-color: #d97706;
        }

        .swagger-ui .btn.execute:hover {
          background: #b45309;
        }

        .swagger-ui select {
          border-radius: 6px;
        }

        .swagger-ui input[type="text"],
        .swagger-ui textarea {
          border-radius: 6px;
        }

        .swagger-ui .model-box {
          border-radius: 8px;
        }

        .swagger-ui section.models {
          border-radius: 8px;
        }

        .swagger-ui section.models.is-open h4 {
          border-radius: 8px 8px 0 0;
        }
      `}</style>
    </div>
  );
}
