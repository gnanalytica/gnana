import { WebClient } from "@slack/web-api";

export interface SlackConnectorConfig {
  token: string; // Bot OAuth token (xoxb-...)
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: unknown, ctx?: unknown) => Promise<string>;
}

export function createSlackConnector(config: SlackConnectorConfig): ToolDefinition[] {
  const client = new WebClient(config.token);

  return [
    {
      name: "slack_send_message",
      description: "Send a message to a Slack channel",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID or name" },
          text: { type: "string", description: "Message text" },
          thread_ts: {
            type: "string",
            description: "Thread timestamp to reply to (optional)",
          },
        },
        required: ["channel", "text"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await client.chat.postMessage({
          channel: p["channel"] as string,
          text: p["text"] as string,
          thread_ts: p["thread_ts"] as string | undefined,
        });
        return JSON.stringify({
          ok: res.ok,
          ts: res.ts,
          channel: res.channel,
        });
      },
    },
    {
      name: "slack_list_channels",
      description: "List public channels in the Slack workspace",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Max channels to return (default 100)",
          },
        },
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await client.conversations.list({
          limit: (p["limit"] as number) ?? 100,
          types: "public_channel",
        });
        return JSON.stringify(
          res.channels?.map((c) => ({
            id: c.id,
            name: c.name,
            topic: c.topic?.value,
            num_members: c.num_members,
          })) ?? [],
        );
      },
    },
    {
      name: "slack_read_channel",
      description: "Read recent messages from a Slack channel",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID" },
          limit: {
            type: "number",
            description: "Number of messages (default 20)",
          },
        },
        required: ["channel"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await client.conversations.history({
          channel: p["channel"] as string,
          limit: (p["limit"] as number) ?? 20,
        });
        return JSON.stringify(
          res.messages?.map((m) => ({
            user: m.user,
            text: m.text,
            ts: m.ts,
            thread_ts: m.thread_ts,
          })) ?? [],
        );
      },
    },
    {
      name: "slack_search_messages",
      description: "Search for messages across the Slack workspace",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          count: {
            type: "number",
            description: "Results to return (default 20)",
          },
        },
        required: ["query"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await client.search.messages({
          query: p["query"] as string,
          count: (p["count"] as number) ?? 20,
        });
        return JSON.stringify(
          res.messages?.matches?.map((m) => ({
            text: m.text,
            user: m.user,
            channel: (m.channel as { name?: string } | undefined)?.name,
            ts: m.ts,
            permalink: m.permalink,
          })) ?? [],
        );
      },
    },
    {
      name: "slack_add_reaction",
      description: "Add an emoji reaction to a message",
      inputSchema: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID" },
          timestamp: { type: "string", description: "Message timestamp" },
          name: {
            type: "string",
            description: "Emoji name (without colons)",
          },
        },
        required: ["channel", "timestamp", "name"],
      },
      handler: async (input: unknown) => {
        const p = input as Record<string, unknown>;
        const res = await client.reactions.add({
          channel: p["channel"] as string,
          timestamp: p["timestamp"] as string,
          name: p["name"] as string,
        });
        return JSON.stringify({ ok: res.ok });
      },
    },
  ];
}
