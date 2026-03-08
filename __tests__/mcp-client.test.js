/**
 * services/mcp-client.js 单元测试
 */
import { jest } from "@jest/globals";

// Mock MCP SDK
const mockConnect = jest.fn();
const mockListTools = jest.fn();
const mockCallTool = jest.fn();
const mockClose = jest.fn();

jest.unstable_mockModule("@modelcontextprotocol/sdk/client/index.js", () => ({
  Client: jest.fn().mockImplementation(() => ({
    connect: mockConnect,
    listTools: mockListTools,
    callTool: mockCallTool,
    close: mockClose,
  })),
}));

jest.unstable_mockModule("@modelcontextprotocol/sdk/client/stdio.js", () => ({
  StdioClientTransport: jest.fn().mockImplementation(() => ({})),
}));

// 动态导入被测模块
const { mcpManager, initMCPServers } = await import(
  "../src/services/mcp-client.js"
);

describe("MCPClientManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 清理已连接的客户端
    mcpManager.clients.clear();
    mcpManager.toolsCache = [];
  });

  describe("connectToServer", () => {
    it("should connect to MCP server and list tools", async () => {
      const mockTools = [
        { name: "create_issue", description: "Create an issue", inputSchema: {} },
        { name: "list_repos", description: "List repositories", inputSchema: {} },
      ];

      mockConnect.mockResolvedValue(undefined);
      mockListTools.mockResolvedValue({ tools: mockTools });

      const tools = await mcpManager.connectToServer(
        "github",
        "npx",
        ["-y", "@modelcontextprotocol/server-github"],
        { GITHUB_TOKEN: "test-token" }
      );

      expect(tools).toHaveLength(2);
      expect(mcpManager.getConnectedServers()).toContain("github");
    });

    it("should throw error on connection failure", async () => {
      mockConnect.mockRejectedValue(new Error("Connection failed"));

      await expect(
        mcpManager.connectToServer("failing-server", "npx", [])
      ).rejects.toThrow("Connection failed");
    });
  });

  describe("getAllTools", () => {
    it("should return empty array when no servers connected", () => {
      const tools = mcpManager.getAllTools();
      expect(tools).toEqual([]);
    });

    it("should return tools with prefixed names", async () => {
      const mockTools = [
        { name: "create_issue", description: "Create an issue", inputSchema: {} },
      ];

      mockConnect.mockResolvedValue(undefined);
      mockListTools.mockResolvedValue({ tools: mockTools });

      await mcpManager.connectToServer("github", "npx", []);

      const tools = mcpManager.getAllTools();
      expect(tools[0].name).toBe("mcp_github__create_issue");
      expect(tools[0].description).toContain("[MCP:github]");
    });
  });

  describe("isMCPTool", () => {
    it("should return true for MCP tool names", () => {
      expect(mcpManager.isMCPTool("mcp_github__create_issue")).toBe(true);
      expect(mcpManager.isMCPTool("mcp_gitlab__create_mr")).toBe(true);
    });

    it("should return false for non-MCP tool names", () => {
      expect(mcpManager.isMCPTool("bash")).toBe(false);
      expect(mcpManager.isMCPTool("read_file")).toBe(false);
    });
  });

  describe("callTool", () => {
    beforeEach(async () => {
      const mockTools = [
        { name: "create_issue", description: "Create an issue", inputSchema: {} },
      ];

      mockConnect.mockResolvedValue(undefined);
      mockListTools.mockResolvedValue({ tools: mockTools });

      await mcpManager.connectToServer("github", "npx", []);
    });

    it("should call tool and return result", async () => {
      mockCallTool.mockResolvedValue({
        content: [{ type: "text", text: "Issue created successfully" }],
      });

      const result = await mcpManager.callTool("mcp_github__create_issue", {
        title: "Test Issue",
      });

      expect(result).toBe("Issue created successfully");
      expect(mockCallTool).toHaveBeenCalledWith({
        name: "create_issue",
        arguments: { title: "Test Issue" },
      });
    });

    it("should throw error for invalid tool name format", async () => {
      await expect(
        mcpManager.callTool("invalid_tool_name", {})
      ).rejects.toThrow("Invalid MCP tool name format");
    });

    it("should throw error for unconnected server", async () => {
      await expect(
        mcpManager.callTool("mcp_unknown__some_tool", {})
      ).rejects.toThrow("MCP Server not connected");
    });

    it("should handle tool execution errors", async () => {
      mockCallTool.mockRejectedValue(new Error("Tool execution failed"));

      const result = await mcpManager.callTool("mcp_github__create_issue", {});
      expect(result).toContain("MCP tool error");
    });
  });

  describe("disconnectAll", () => {
    it("should disconnect all servers", async () => {
      mockConnect.mockResolvedValue(undefined);
      mockListTools.mockResolvedValue({ tools: [] });
      mockClose.mockResolvedValue(undefined);

      await mcpManager.connectToServer("github", "npx", []);

      await mcpManager.disconnectAll();

      expect(mockClose).toHaveBeenCalled();
      expect(mcpManager.getConnectedServers()).toHaveLength(0);
    });
  });

  describe("getConnectedServers", () => {
    it("should return list of connected server names", async () => {
      mockConnect.mockResolvedValue(undefined);
      mockListTools.mockResolvedValue({ tools: [] });

      await mcpManager.connectToServer("server1", "npx", []);
      await mcpManager.connectToServer("server2", "npx", []);

      const servers = mcpManager.getConnectedServers();
      expect(servers).toContain("server1");
      expect(servers).toContain("server2");
    });
  });
});

describe("initMCPServers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mcpManager.clients.clear();
    mcpManager.toolsCache = [];
  });

  it("should skip initialization when no config", async () => {
    await initMCPServers(null);
    expect(mcpManager.getConnectedServers()).toHaveLength(0);
  });

  it("should skip disabled servers", async () => {
    const config = {
      servers: {
        github: {
          enabled: false,
          command: "npx",
          args: [],
        },
      },
    };

    await initMCPServers(config);
    expect(mcpManager.getConnectedServers()).toHaveLength(0);
  });

  it("should connect enabled servers", async () => {
    mockConnect.mockResolvedValue(undefined);
    mockListTools.mockResolvedValue({ tools: [] });

    const config = {
      servers: {
        github: {
          enabled: true,
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-github"],
          env: { GITHUB_TOKEN: "test" },
        },
      },
    };

    await initMCPServers(config);
    expect(mcpManager.getConnectedServers()).toContain("github");
  });

  it("should continue on server connection failure", async () => {
    mockConnect.mockRejectedValue(new Error("Connection failed"));

    const config = {
      servers: {
        failing: {
          enabled: true,
          command: "npx",
          args: [],
        },
      },
    };

    // 不应该抛出错误
    await expect(initMCPServers(config)).resolves.not.toThrow();
  });
});
