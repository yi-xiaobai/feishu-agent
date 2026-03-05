import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

// 默认工作目录
let workDir = process.cwd();

/**
 * 设置工作目录
 */
export function setWorkDir(dir) {
  workDir = dir;
}

/**
 * 安全路径检查 - 防止路径逃逸到工作目录之外
 */
function safePath(p) {
  const fullPath = path.resolve(workDir, p);
  if (!fullPath.startsWith(workDir)) {
    throw new Error(`Path escapes workspace: ${p}`);
  }
  return fullPath;
}

/**
 * 执行 bash 命令
 */
export async function runBash(command) {
  const dangerous = ["rm -rf /", "sudo", "shutdown", "reboot", "> /dev/"];
  if (dangerous.some((d) => command.includes(d))) {
    return "Error: Dangerous command blocked";
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10,
    });
    const output = (stdout + stderr).trim();
    return output ? output.slice(0, 50000) : "(no output)";
  } catch (error) {
    if (error.killed) {
      return "Error: Timeout (120s)";
    }
    const output = ((error.stdout || "") + (error.stderr || "")).trim();
    return output || `Error: ${error.message}`;
  }
}

/**
 * 读取文件内容
 */
export async function runRead(filePath, limit = null) {
  try {
    const fullPath = safePath(filePath);
    const text = await fs.readFile(fullPath, "utf-8");
    let lines = text.split("\n");

    if (limit && limit < lines.length) {
      lines = [...lines.slice(0, limit), `... (${lines.length - limit} more lines)`];
    }

    return lines.join("\n").slice(0, 50000);
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * 写入文件
 */
export async function runWrite(filePath, content) {
  try {
    const fullPath = safePath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf-8");
    return `Wrote ${content.length} bytes to ${filePath}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * 编辑文件
 */
export async function runEdit(filePath, oldText, newText) {
  try {
    const fullPath = safePath(filePath);
    const content = await fs.readFile(fullPath, "utf-8");

    if (!content.includes(oldText)) {
      return `Error: Text not found in ${filePath}`;
    }

    const newContent = content.replace(oldText, newText);
    await fs.writeFile(fullPath, newContent, "utf-8");
    return `Edited ${filePath}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * 查找文件
 */
export async function runFind(pattern, dir = ".") {
  try {
    const searchDir = safePath(dir);
    const { stdout, stderr } = await execAsync(
      `find "${searchDir}" -type f -iname "*${pattern}*" 2>/dev/null | head -50`,
      { cwd: workDir, timeout: 30000 }
    );
    const output = stdout.trim();
    if (!output) {
      return `No files found matching: ${pattern}`;
    }
    const files = output.split("\n").map((f) => path.relative(workDir, f));
    return `Found ${files.length} file(s):\n${files.join("\n")}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
