import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      cytoscape: path.resolve(__dirname, "node_modules/cytoscape/dist/cytoscape.esm.min.mjs"),
    },
    dedupe: ["react", "react-dom"],
  },
  // 使用相对路径，确保 Electron loadFile 能正确加载资源
  base: "./",
  build: {
    // 生产环境使用相对路径
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 750,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("vite/preload-helper")) return "vendor-preload";
          if (!id.includes("node_modules")) return;
          if (id.includes("@mermaid-js/parser")) return "vendor-mermaid-parser";
          if (id.includes("mermaid/dist/mermaid.core.mjs") || id.includes("mermaid/dist/chunks/mermaid.core/chunk-CSCIHK7Q")) return "vendor-mermaid-core";
          if (id.includes("dompurify") || id.includes("khroma") || id.includes("d3")) return "vendor-mermaid-runtime";
          if (id.includes("dagre")) return "vendor-graph-layout";
          if (id.includes("cytoscape")) return "vendor-cytoscape";
          if (id.includes("katex")) return "vendor-katex";
          if (id.includes("d3-")) return "vendor-d3";
          if (id.includes("@xyflow")) return "vendor-graph";
          if (id.includes("react-markdown") || id.includes("remark-") || id.includes("mdast") || id.includes("micromark")) {
            return "vendor-markdown";
          }
          if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) return "vendor-react";
        },
      },
    },
  },
  server: {
    port: 5175,
    host: true,
    proxy: { "/api": { target: "http://127.0.0.1:3085", changeOrigin: true } },
  },
});
