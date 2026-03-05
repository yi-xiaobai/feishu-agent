import * as tools from "./index.js";

/**
 * 工具处理器映射
 */
export const TOOL_HANDLERS = {
  bash: ({ command }) => tools.runBash(command),
  read_file: ({ path, limit }) => tools.runRead(path, limit),
  write_file: ({ path, content }) => tools.runWrite(path, content),
  edit_file: ({ path, old_text, new_text }) => tools.runEdit(path, old_text, new_text),
  find_file: ({ pattern, dir }) => tools.runFind(pattern, dir),
};
