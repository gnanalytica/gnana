export interface HttpEndpointConfig {
  name: string;
  description: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  queryParams?: Record<string, { type: string; description: string; required?: boolean }>;
  bodySchema?: Record<string, unknown>;
  headers?: Record<string, string>;
}

export interface HttpConnectorConfig {
  baseUrl: string;
  auth?: {
    type: "bearer" | "basic" | "api-key";
    token?: string;
    username?: string;
    password?: string;
    headerName?: string;
    apiKey?: string;
  };
  defaultHeaders?: Record<string, string>;
  endpoints: HttpEndpointConfig[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: unknown, ctx?: unknown) => Promise<string>;
}

export function createHttpConnector(config: HttpConnectorConfig): ToolDefinition[] {
  return config.endpoints.map((endpoint) => ({
    name: `http_${endpoint.name}`,
    description: endpoint.description,
    inputSchema: buildInputSchema(endpoint),
    handler: async (input: unknown) => {
      const params = input as Record<string, unknown>;
      let url = `${config.baseUrl}${endpoint.path}`;

      // Replace path parameters like :id
      url = url.replace(/:(\w+)/g, (_, key: string) => {
        const val = params[key];
        return val != null ? String(val) : `:${key}`;
      });

      // Build query string
      if (endpoint.queryParams) {
        const searchParams = new URLSearchParams();
        for (const key of Object.keys(endpoint.queryParams)) {
          if (params[key] != null) {
            searchParams.set(key, String(params[key]));
          }
        }
        const qs = searchParams.toString();
        if (qs) url += `?${qs}`;
      }

      // Build headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...config.defaultHeaders,
        ...endpoint.headers,
      };

      // Add auth
      if (config.auth) {
        if (config.auth.type === "bearer" && config.auth.token) {
          headers["Authorization"] = `Bearer ${config.auth.token}`;
        } else if (config.auth.type === "basic" && config.auth.username) {
          const creds = btoa(`${config.auth.username}:${config.auth.password ?? ""}`);
          headers["Authorization"] = `Basic ${creds}`;
        } else if (config.auth.type === "api-key" && config.auth.apiKey) {
          headers[config.auth.headerName ?? "X-API-Key"] = config.auth.apiKey;
        }
      }

      // Build request options
      const fetchOptions: RequestInit = { method: endpoint.method, headers };
      if (["POST", "PUT", "PATCH"].includes(endpoint.method) && params["body"]) {
        fetchOptions.body = JSON.stringify(params["body"]);
      }

      const response = await fetch(url, fetchOptions);
      const text = await response.text();

      if (!response.ok) {
        return JSON.stringify({
          error: true,
          status: response.status,
          statusText: response.statusText,
          body: text,
        });
      }

      return text;
    },
  }));
}

function buildInputSchema(endpoint: HttpEndpointConfig): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  // Path parameters
  const pathParams = endpoint.path.match(/:(\w+)/g);
  if (pathParams) {
    for (const param of pathParams) {
      const name = param.slice(1);
      properties[name] = {
        type: "string",
        description: `Path parameter: ${name}`,
      };
      required.push(name);
    }
  }

  // Query parameters
  if (endpoint.queryParams) {
    for (const [key, paramConfig] of Object.entries(endpoint.queryParams)) {
      properties[key] = {
        type: paramConfig.type,
        description: paramConfig.description,
      };
      if (paramConfig.required) required.push(key);
    }
  }

  // Body
  if (["POST", "PUT", "PATCH"].includes(endpoint.method)) {
    properties["body"] = endpoint.bodySchema ?? {
      type: "object",
      description: "Request body",
    };
  }

  return {
    type: "object",
    properties,
    required: required.length > 0 ? required : undefined,
  };
}
