import "dotenv/config";
import { spawn } from "node:child_process";
import "./run_chain.ts";

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", shell: true });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`))));
  });
}

async function main() {
  // Add more chains later
  await run("npx", ["tsx", "src/runs/run_chain.ts", "shufersal"]);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
