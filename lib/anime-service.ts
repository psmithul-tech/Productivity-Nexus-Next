import { exec } from "child_process";
import path from "path";

const BIN_DIR = path.join(process.cwd(), "bin");
const LUFFY_BIN = path.join(BIN_DIR, "luffy");

export async function extractStreamUrl(title: string, provider: string, episode?: string, season?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let args = `"${title.replace(/"/g, '\\"')}" --provider ${provider} --debug --best`;
    
    if (episode) args += ` -e ${episode}`;
    if (season) args += ` -s ${season}`;

    console.log("Executing Luffy:", args);

    const env = { ...process.env, PATH: `${BIN_DIR}:${process.env.PATH}` };

    exec(`"${LUFFY_BIN}" ${args}`, { maxBuffer: 1024 * 1024 * 10, env }, (error, stdout, stderr) => {
      const output = stdout + "\n" + stderr;
      
      const match = output.match(/(?:Stream|Master) URL:\s*([^\s]+)/i);

      if (match) {
        let url = match[1];
        if (!url.startsWith("http")) {
          url = "https://" + url;
        }
        resolve(url);
      } else {
        console.error("Luffy Output:", output);
        reject(new Error("Stream URL not found in luffy output"));
      }
    });
  });
}
