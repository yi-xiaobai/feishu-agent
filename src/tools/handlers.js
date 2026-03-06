import * as tools from "./index.js";
import { skillLoader } from "../utils/skills.js";

/**
 * 工具处理器映射
 */
export const TOOL_HANDLERS = {
  // 基础工具
  bash: ({ command }) => tools.runBash(command),
  read_file: ({ path, limit }) => tools.runRead(path, limit),
  write_file: ({ path, content }) => tools.runWrite(path, content),
  edit_file: ({ path, old_text, new_text }) => tools.runEdit(path, old_text, new_text),
  find_file: ({ pattern, dir }) => tools.runFind(pattern, dir),

  // 项目管理工具
  find_projects: ({ refresh }) => tools.runFindProjects(refresh),
  open_project: ({ name }) => tools.runOpenProject(name),
  search_code: ({ keyword, file_pattern, max_results }) =>
    tools.runSearchCode(keyword, file_pattern, max_results),
  search_all_projects: ({ keyword, project_filter, max_results }) =>
    tools.runSearchAllProjects(keyword, project_filter, max_results),

  // IDE 工具
  open_in_ide: ({ path, ide }) => tools.runOpenInIDE(path, ide),

  // Skills 系统
  load_skill: ({ name }) => skillLoader.getContent(name),
};
