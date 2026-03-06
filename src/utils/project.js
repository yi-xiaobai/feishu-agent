import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import config from "../config/index.js";

const execAsync = promisify(exec);

// 项目缓存
let projectCache = null;
let cacheTimestamp = 0;

/**
 * 检查目录是否是项目根目录
 */
async function isProjectRoot(dirPath) {
  try {
    const files = await fs.readdir(dirPath);
    // 检查是否包含项目特征文件
    const hasPackageJson = files.includes("package.json");
    const hasGit = files.includes(".git");
    const hasGoMod = files.includes("go.mod");
    const hasPyProject = files.includes("pyproject.toml");
    const hasCargoToml = files.includes("Cargo.toml");

    return hasPackageJson || hasGit || hasGoMod || hasPyProject || hasCargoToml;
  } catch {
    return false;
  }
}

/**
 * 递归扫描目录查找所有项目
 */
async function scanDirectory(dirPath, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return [];

  const projects = [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      // 跳过排除的目录
      if (config.projects.excludeDirs.includes(entry.name)) continue;

      const fullPath = path.join(dirPath, entry.name);

      // 检查是否是项目根目录
      if (await isProjectRoot(fullPath)) {
        projects.push({
          name: entry.name,
          path: fullPath,
          parentDir: path.basename(dirPath),
        });
      }

      // 继续递归搜索子目录
      const subProjects = await scanDirectory(fullPath, depth + 1, maxDepth);
      projects.push(...subProjects);
    }
  } catch (error) {
    // 忽略无权限访问的目录
  }

  return projects;
}

/**
 * 扫描所有项目并缓存
 */
export async function scanAllProjects(forceRefresh = false) {
  const now = Date.now();

  // 检查缓存是否有效
  if (
    !forceRefresh &&
    projectCache &&
    now - cacheTimestamp < config.projects.cacheTimeout
  ) {
    return projectCache;
  }

  console.log("🔍 扫描项目目录:", config.projects.basePath);

  const projects = await scanDirectory(
    config.projects.basePath,
    0,
    config.projects.searchDepth
  );

  projectCache = projects;
  cacheTimestamp = now;

  console.log(`✅ 找到 ${projects.length} 个项目`);

  return projects;
}

/**
 * 查找单个项目路径
 */
export async function findProjectPath(projectName) {
  const projects = await scanAllProjects();

  // 精确匹配
  let project = projects.find((p) => p.name === projectName);

  // 模糊匹配
  if (!project) {
    project = projects.find((p) =>
      p.name.toLowerCase().includes(projectName.toLowerCase())
    );
  }

  // 通过父目录匹配
  if (!project) {
    project = projects.find((p) =>
      p.parentDir.toLowerCase().includes(projectName.toLowerCase())
    );
  }

  if (!project) {
    throw new Error(
      `项目 "${projectName}" 未找到。可用项目: ${projects.map((p) => p.name).join(", ")}`
    );
  }

  return project;
}

/**
 * 获取所有项目列表
 */
export async function getAllProjects() {
  return await scanAllProjects();
}

/**
 * 清除项目缓存
 */
export function clearProjectCache() {
  projectCache = null;
  cacheTimestamp = 0;
}
