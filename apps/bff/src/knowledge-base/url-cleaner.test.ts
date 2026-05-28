import assert from "node:assert/strict";
import { cleanUrlImportContent } from "./url-cleaner.js";
import { clearTokenJuiceMetrics, configureTokenJuiceMetricsPersistence, getTokenJuiceMetrics } from "../tokenjuice/metrics.js";

configureTokenJuiceMetricsPersistence({ filePath: null });
clearTokenJuiceMetrics();

const html = `
<!doctype html>
<html>
  <head>
    <title>MineEcho &amp; HCI Guide</title>
    <style>.ad{display:none}</style>
    <script>window.noise = true</script>
  </head>
  <body>
    <nav>Home Pricing Subscribe</nav>
    <main>
      <h1>深信服 HCI 部署方案</h1>
      <p>这里是正文 &amp; 关键结论。</p>
      <p><a href="https://example.com/hci">参考链接</a></p>
      <ul><li>节点规划</li><li>网络配置</li></ul>
    </main>
    <footer>Privacy Policy</footer>
  </body>
</html>`;

const result = await cleanUrlImportContent({
  rawText: html,
  contentType: "text/html; charset=utf-8",
  url: "https://example.com/hci",
});

assert(result.text.includes("深信服 HCI 部署方案"));
assert(result.text.includes("参考链接 (https://example.com/hci)"));
assert(result.text.includes("- 节点规划"));
assert(!result.text.includes("window.noise"));
assert(!result.text.includes("Privacy Policy"));
assert(!result.text.includes("Home Pricing Subscribe"));
assert(result.stats.cleanedChars < result.stats.rawChars);

const metrics = getTokenJuiceMetrics();
assert(metrics.totalRuns >= 1);
assert(metrics.recent.some((record) => record.family === "document-html"));

clearTokenJuiceMetrics();
configureTokenJuiceMetricsPersistence({ filePath: null });

console.log("Knowledge URL cleaner assertions passed");
