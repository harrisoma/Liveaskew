import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

const ONIXUS_REQUEST_ID_HEADER = "X-Onixus-Request-ID";
const ONIXUS_CLIENT = "liveaskew";

function required(value: string | undefined, name: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing ${name}`);
  return normalized;
}

export function getOnixusAiConfig(apiKeyOverride?: string) {
  return {
    apiKey: required(apiKeyOverride ?? process.env.ONIXUS_AI_API_KEY, "ONIXUS_AI_API_KEY"),
    baseURL: required(process.env.ONIXUS_AI_BASE_URL, "ONIXUS_AI_BASE_URL").replace(/\/$/, ""),
    organizationId: required(
      process.env.ONIXUS_AI_ORGANIZATION_ID,
      "ONIXUS_AI_ORGANIZATION_ID",
    ),
  };
}

export function getOnixusAiHeaders(apiKeyOverride?: string): Record<string, string> {
  const config = getOnixusAiConfig(apiKeyOverride);
  return {
    Authorization: `Bearer ${config.apiKey}`,
    "X-Onixus-Organization-ID": config.organizationId,
    "X-Onixus-Client": ONIXUS_CLIENT,
  };
}

export function getOnixusAiUrl(path: string, apiKeyOverride?: string): string {
  const { baseURL } = getOnixusAiConfig(apiKeyOverride);
  return `${baseURL}/${path.replace(/^\//, "")}`;
}

export function createOnixusAiGatewayProvider(apiKey: string, initialRequestId?: string) {
  const config = getOnixusAiConfig(apiKey);
  let requestId = initialRequestId?.trim() || undefined;
  let resolveRequestId: (value: string | undefined) => void = () => {};
  let requestIdResolved = false;
  const requestIdReady = new Promise<string | undefined>((resolve) => {
    resolveRequestId = resolve;
  });

  const publishRequestId = (value?: string) => {
    const next = value?.trim() || undefined;
    if (!requestId && next) requestId = next;
    if (!requestIdResolved) {
      requestIdResolved = true;
      resolveRequestId(requestId);
    }
  };
  if (requestId) publishRequestId(requestId);

  const provider = createOpenAICompatible({
    name: "onixus-liveaskew",
    baseURL: config.baseURL,
    headers: getOnixusAiHeaders(apiKey),
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (requestId && !headers.has(ONIXUS_REQUEST_ID_HEADER)) {
        headers.set(ONIXUS_REQUEST_ID_HEADER, requestId);
      }
      try {
        const response = await fetch(input, { ...init, headers });
        publishRequestId(response.headers.get(ONIXUS_REQUEST_ID_HEADER) ?? undefined);
        return response;
      } catch (error) {
        publishRequestId(undefined);
        throw error;
      }
    },
  });

  return Object.assign(provider, {
    getRunId: () => requestId,
    waitForRunId: () => (requestId ? Promise.resolve(requestId) : requestIdReady),
  });
}
