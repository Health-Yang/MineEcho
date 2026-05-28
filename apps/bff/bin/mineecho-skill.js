#!/usr/bin/env node
/**
 * MineEcho Skill CLI - 命令行技能上传工具
 *
 * Usage:
 *   mineecho-skill upload <file> [--host http://localhost:3085]
 *   mineecho-skill list [--host http://localhost:3085]
 *
 * Examples:
 *   mineecho-skill upload ./my-skill.zip
 *   mineecho-skill upload ./my-skill.skill --host http://192.168.1.100:3085
 *   mineecho-skill list
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import https from "node:https";

const DEFAULT_HOST = process.env.MINEECHO_HOST || process.env.SCLAW_HOST || "http://127.0.0.1:3085";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDuration(ms) {
  if (ms < 1000) return ms + "ms";
  return (ms / 1000).toFixed(1) + "s";
}

function progressBar(percent, width = 30) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

async function uploadFile(filePath, host) {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ 文件不存在: ${resolvedPath}`);
    process.exit(1);
  }

  const stats = fs.statSync(resolvedPath);
  if (!stats.isFile()) {
    console.error(`❌ 不是文件: ${resolvedPath}`);
    process.exit(1);
  }

  const fileName = path.basename(resolvedPath);
  const ext = path.extname(resolvedPath).toLowerCase();
  if (ext !== ".zip" && ext !== ".skill") {
    console.error(`❌ 不支持的文件格式: ${ext}，只支持 .zip 和 .skill`);
    process.exit(1);
  }

  const fileSize = stats.size;
  console.log(`📦 文件: ${fileName}`);
  console.log(`📏 大小: ${formatBytes(fileSize)}`);
  console.log(`🌐 服务器: ${host}`);
  console.log();

  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const client = host.startsWith("https:") ? https : http;
    const url = new URL("/api/skills/import-file", host);

    const boundary = "----MineEchoSkillUpload" + Date.now();
    const fileData = fs.readFileSync(resolvedPath);

    const pre = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
      `Content-Type: application/octet-stream\r\n\r\n`
    );
    const post = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([pre, fileData, post]);

    const req = client.request(
      {
        hostname: url.hostname,
        port: url.port || (host.startsWith("https:") ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
        },
      },
      (res) => {
        let responseData = "";
        res.on("data", (chunk) => {
          responseData += chunk;
        });
        res.on("end", () => {
          const duration = Date.now() - startTime;
          console.log(); // newline after progress

          try {
            const data = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300 && data.ok) {
              console.log(`✅ 导入成功 (${formatDuration(duration)})`);
              console.log(`   技能名称: ${data.name || "未知"}`);
              console.log(`   技能 ID: ${data.id}`);
              if (data.scanSummary) {
                console.log(`   轻量扫描: ✓ 通过`);
                if (data.scanSummary.deepScanRan) {
                  console.log(`   深度扫描: ✓ 通过`);
                } else {
                  console.log(`   深度扫描: ○ 未运行 (未安装 skill-scanner)`);
                }
              }
              if (data.scannerHint) {
                console.log(`   提示: ${data.scannerHint}`);
              }
              resolve(data);
            } else {
              console.error(`❌ 导入失败 (${formatDuration(duration)})`);
              if (data.quarantined) {
                console.error(`   已隔离: ${data.message}`);
                if (data.report) {
                  console.error(`   扫描报告:`);
                  data.report.forEach((r) => {
                    console.error(`     - [${r.code}] ${r.message}`);
                  });
                }
              } else {
                console.error(`   错误: ${data.error || data.message || "未知错误"}`);
              }
              reject(new Error(data.error || data.message || "导入失败"));
            }
          } catch {
            console.error(`❌ 解析响应失败: ${responseData.slice(0, 200)}`);
            reject(new Error("解析响应失败"));
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error(`❌ 请求失败: ${err.message}`);
      reject(err);
    });

    // Chunked upload with progress
    let sent = 0;
    const chunkSize = 64 * 1024; // 64KB chunks
    let offset = 0;

    function sendNextChunk() {
      const remaining = body.length - offset;
      if (remaining <= 0) {
        req.end();
        return;
      }
      const toWrite = Math.min(chunkSize, remaining);
      req.write(body.slice(offset, offset + toWrite));
      offset += toWrite;
      sent += toWrite;

      const percent = Math.round((sent / body.length) * 100);
      process.stdout.write(`\r⬆️  上传中 ${progressBar(percent)} ${percent}% ${formatBytes(sent)}/${formatBytes(body.length)}`);

      setImmediate(sendNextChunk);
    }

    sendNextChunk();
  });
}

async function listSkills(host) {
  console.log(`🌐 服务器: ${host}`);
  console.log();

  const client = host.startsWith("https:") ? https : http;
  const url = new URL("/api/skills/all", host);

  return new Promise((resolve, reject) => {
    const req = client.get(
      {
        hostname: url.hostname,
        port: url.port || (host.startsWith("https:") ? 443 : 80),
        path: url.pathname,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            const builtin = result.builtin || [];
            const extensions = result.extensions || [];

            console.log(`📚 内置技能 (${builtin.length}):`);
            builtin.forEach((s) => {
              const status = s.enabled !== false ? "✅" : "❌";
              console.log(`   ${status} ${s.name} (${s.id})`);
            });

            console.log();
            console.log(`🔧 扩展技能 (${extensions.length}):`);
            extensions.forEach((s) => {
              const status = s.enabled !== false ? "✅" : "❌";
              console.log(`   ${status} ${s.name} (${s.id})`);
            });

            resolve(result);
          } catch {
            console.error("❌ 解析响应失败");
            reject(new Error("解析失败"));
          }
        });
      }
    );

    req.on("error", (err) => {
      console.error(`❌ 请求失败: ${err.message}`);
      reject(err);
    });
  });
}

function showHelp() {
  console.log(`
MineEcho Skill CLI - 技能管理命令行工具

Usage:
  mineecho-skill upload <file> [options]    上传技能文件 (.zip / .skill)
  mineecho-skill list [options]             列出所有技能
  mineecho-skill help                       显示帮助

Options:
  --host <url>    服务器地址 (默认: ${DEFAULT_HOST})
  -h, --help      显示帮助

Environment:
  MINEECHO_HOST   默认服务器地址
  SCLAW_HOST      旧版兼容变量，优先级低于 MINEECHO_HOST

Examples:
  mineecho-skill upload ./my-skill.zip
  mineecho-skill upload ./my-skill.skill --host http://192.168.1.100:3085
  mineecho-skill list
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "help" || args[0] === "-h" || args[0] === "--help") {
    showHelp();
    process.exit(0);
  }

  const command = args[0];
  let host = DEFAULT_HOST;
  const hostIdx = args.indexOf("--host");
  if (hostIdx !== -1 && args[hostIdx + 1]) {
    host = args[hostIdx + 1];
  }

  try {
    if (command === "upload") {
      const filePath = args[1];
      if (!filePath) {
        console.error("❌ 请指定要上传的文件");
        console.error("   用法: mineecho-skill upload <file>");
        process.exit(1);
      }
      await uploadFile(filePath, host);
    } else if (command === "list") {
      await listSkills(host);
    } else {
      console.error(`❌ 未知命令: ${command}`);
      showHelp();
      process.exit(1);
    }
  } catch {
    process.exit(1);
  }
}

main();
