import { chatSendStream } from "../src/gateway/client.js";

async function main() {
  console.log("=== Debug Chat Stream ===\n");

  const events: string[] = [];

  await chatSendStream(
    "test-session",
    "深信服的fastgpt产品的安装前需要准备哪些东西吗",
    {
      onStarted: (runId) => {
        events.push(`[started] runId=${runId}`);
        console.log(`[started] runId=${runId}`);
      },
      onDelta: (text) => {
        events.push(`[delta] ${text}`);
        process.stdout.write(text);
      },
      onFinal: (text) => {
        events.push(`[final] ${text.slice(0, 200)}`);
        console.log(`\n\n[final] ${text.slice(0, 500)}`);
      },
      onError: (err) => {
        events.push(`[error] ${err}`);
        console.log(`\n[error] ${err}`);
      },
      onStatus: (status) => {
        events.push(`[status] ${JSON.stringify(status)}`);
        console.log(`[status] ${JSON.stringify(status)}`);
      },
    },
    120000
  );

  console.log("\n\n=== All events ===");
  for (const e of events) {
    console.log(e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
