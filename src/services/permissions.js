import path from "path";

const HARD_DENY = [
  /(^|\s)sudo(\s|$)/i,
  /rm\s+-[^\n]*r[^\n]*f[^\n]*(?:\/\s*$|\/\*)/i,
  /(^|\s)(shutdown|reboot|mkfs)(\s|$)/i,
  /dd\s+if=/i,
  />\s*\/dev\//i,
];

const RISKY_SHELL = [
  /(^|[;&|]\s*)rm\s/i,
  />\s*\/etc\//i,
  /chmod\s+777/i,
  /git\s+push\s+.*--force/i,
  /git\s+reset\s+--hard/i,
];

export function checkPermission(toolName, input = {}, context = {}) {
  if (toolName === "bash") {
    const command = String(input.command || "");
    if (HARD_DENY.some((pattern) => pattern.test(command))) {
      return { behavior: "deny", reason: "命令命中永久禁止规则" };
    }
    if (RISKY_SHELL.some((pattern) => pattern.test(command))) {
      return { behavior: "ask", reason: "命令可能造成破坏性变更" };
    }
  }

  if (["write_file", "edit_file"].includes(toolName) && input.path) {
    const workspace = path.resolve(context.workDir || process.cwd());
    const target = path.resolve(workspace, input.path);
    if (target !== workspace && !target.startsWith(`${workspace}${path.sep}`)) {
      return { behavior: "ask", reason: "工具将写入工作区之外" };
    }
  }

  return { behavior: "allow" };
}

export function createPermissionHook({ approve, workDir } = {}) {
  return async (block, context = {}) => {
    const decision = checkPermission(block.name, block.input, {
      ...context,
      workDir: context.workDir || workDir,
    });
    if (decision.behavior === "allow") return null;
    if (decision.behavior === "deny") return `Permission denied: ${decision.reason}`;

    const allowed = approve
      ? await approve({ tool: block.name, input: block.input, reason: decision.reason })
      : false;
    return allowed ? null : `Permission approval required: ${decision.reason}`;
  };
}
