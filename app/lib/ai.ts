type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatOptions = {
  provider: "deepseek" | "kimi";
  messages: ChatMessage[];
  maxTokens?: number;
};

export async function createChatCompletion({
  provider,
  messages,
  maxTokens = 420,
}: ChatOptions): Promise<string> {
  const config = provider === "kimi" ? kimiConfig() : deepseekConfig();
  if (!config.apiKey) {
    throw new Error(`${config.label} API key is not configured.`);
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      stream: false,
      temperature: config.temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${config.label} request failed: ${detail.slice(0, 240)}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error(`${config.label} returned an empty response.`);
  }
  return content;
}

function deepseekConfig() {
  return {
    label: "DeepSeek",
    apiKey: process.env.DEEPSEEK_API_KEY ?? "",
    baseUrl: (process.env.DEEPSEEK_API_BASE ?? "https://api.deepseek.com").replace(
      /\/$/,
      "",
    ),
    model: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
    temperature: 0.45,
  };
}

function kimiConfig() {
  return {
    label: "Kimi",
    apiKey: process.env.KIMI_API_KEY ?? process.env.MOONSHOT_API_KEY ?? "",
    baseUrl: (
      process.env.KIMI_API_BASE ??
      process.env.MOONSHOT_API_BASE ??
      "https://api.moonshot.cn/v1"
    ).replace(/\/$/, ""),
    model: process.env.KIMI_MODEL ?? "kimi-k3",
    temperature: 1,
  };
}
