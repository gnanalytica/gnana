import { Octokit } from "@octokit/rest";

export interface GitHubConnectorConfig {
  token: string;
  owner?: string; // default owner for repos
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: unknown, ctx?: unknown) => Promise<string>;
}

export function createGitHubConnector(config: GitHubConnectorConfig): ToolDefinition[] {
  const octokit = new Octokit({ auth: config.token });
  const defaultOwner = config.owner;

  return [
    {
      name: "github_list_repos",
      description: "List repositories for the authenticated user or a specified owner",
      inputSchema: {
        type: "object",
        properties: {
          owner: {
            type: "string",
            description: "Repository owner (optional, defaults to authenticated user)",
          },
          per_page: {
            type: "number",
            description: "Results per page (max 100)",
          },
        },
      },
      handler: async (input: unknown) => {
        const { owner, per_page = 30 } = input as Record<string, unknown>;
        const targetOwner = (owner as string) ?? defaultOwner;
        const res = targetOwner
          ? await octokit.repos.listForUser({
              username: targetOwner,
              per_page: per_page as number,
            })
          : await octokit.repos.listForAuthenticatedUser({
              per_page: per_page as number,
            });
        return JSON.stringify(
          res.data.map((r) => ({
            name: r.name,
            full_name: r.full_name,
            description: r.description,
            html_url: r.html_url,
            language: r.language,
            stars: r.stargazers_count,
          })),
        );
      },
    },
    {
      name: "github_get_issue",
      description: "Get a specific issue by number from a repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          issue_number: { type: "number", description: "Issue number" },
        },
        required: ["repo", "issue_number"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await octokit.issues.get({
          owner: (p["owner"] as string) ?? defaultOwner ?? "",
          repo: p["repo"] as string,
          issue_number: p["issue_number"] as number,
        });
        return JSON.stringify({
          number: res.data.number,
          title: res.data.title,
          state: res.data.state,
          body: res.data.body,
          labels: res.data.labels,
          assignees: res.data.assignees?.map((a: { login: string }) => a.login),
          created_at: res.data.created_at,
          updated_at: res.data.updated_at,
        });
      },
    },
    {
      name: "github_create_issue",
      description: "Create a new issue in a repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          title: { type: "string", description: "Issue title" },
          body: { type: "string", description: "Issue body (markdown)" },
          labels: {
            type: "array",
            items: { type: "string" },
            description: "Labels to apply",
          },
        },
        required: ["repo", "title"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await octokit.issues.create({
          owner: (p["owner"] as string) ?? defaultOwner ?? "",
          repo: p["repo"] as string,
          title: p["title"] as string,
          body: p["body"] as string | undefined,
          labels: p["labels"] as string[] | undefined,
        });
        return JSON.stringify({
          number: res.data.number,
          html_url: res.data.html_url,
        });
      },
    },
    {
      name: "github_list_prs",
      description: "List pull requests in a repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          state: {
            type: "string",
            enum: ["open", "closed", "all"],
            description: "PR state filter",
          },
          per_page: { type: "number", description: "Results per page" },
        },
        required: ["repo"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await octokit.pulls.list({
          owner: (p["owner"] as string) ?? defaultOwner ?? "",
          repo: p["repo"] as string,
          state: (p["state"] as "open" | "closed" | "all") ?? "open",
          per_page: (p["per_page"] as number) ?? 30,
        });
        return JSON.stringify(
          res.data.map((pr) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            html_url: pr.html_url,
            user: pr.user?.login,
            created_at: pr.created_at,
            merged_at: pr.merged_at,
          })),
        );
      },
    },
    {
      name: "github_search_code",
      description: "Search for code across GitHub repositories",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query (GitHub code search syntax)",
          },
          per_page: { type: "number", description: "Results per page" },
        },
        required: ["query"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await octokit.search.code({
          q: p["query"] as string,
          per_page: (p["per_page"] as number) ?? 10,
        });
        return JSON.stringify(
          res.data.items.map((item) => ({
            name: item.name,
            path: item.path,
            repository: item.repository.full_name,
            html_url: item.html_url,
          })),
        );
      },
    },
    {
      name: "github_get_file",
      description: "Get the contents of a file from a repository",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string", description: "Repository owner" },
          repo: { type: "string", description: "Repository name" },
          path: {
            type: "string",
            description: "File path in the repository",
          },
          ref: {
            type: "string",
            description: "Branch, tag, or commit SHA (optional)",
          },
        },
        required: ["repo", "path"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await octokit.repos.getContent({
          owner: (p["owner"] as string) ?? defaultOwner ?? "",
          repo: p["repo"] as string,
          path: p["path"] as string,
          ref: p["ref"] as string | undefined,
        });
        const data = res.data as { type?: string; content?: string };
        if (data.type === "file" && data.content) {
          return Buffer.from(data.content, "base64").toString("utf-8");
        }
        return JSON.stringify(data);
      },
    },
  ];
}
