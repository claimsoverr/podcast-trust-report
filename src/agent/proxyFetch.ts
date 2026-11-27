export function buildProxiedUrl(
  corsProxyUrl: string,
  targetUrl: string,
): string {
  const trimmed = corsProxyUrl.trim();
  if (!trimmed) {
    throw new Error(
      "A CORS Proxy URL is required to fetch Episode data from the browser. Configure it in AI Settings → General.",
    );
  }

  if (trimmed.includes("{url}")) {
    return trimmed.replaceAll("{url}", encodeURIComponent(targetUrl));
  }

  if (trimmed.endsWith("=")) {
    return `${trimmed}${encodeURIComponent(targetUrl)}`;
  }

  return `${trimmed.replace(/\/+$/, "")}/${targetUrl}`;
}

function combineSignals(
  first?: AbortSignal,
  second?: AbortSignal | null,
): AbortSignal | undefined {
  if (first && second) {
    if (typeof AbortSignal.any === "function") {
      return AbortSignal.any([first, second]);
    }
    return second;
  }
  return first ?? second ?? undefined;
}

export function createProxiedFetch(
  corsProxyUrl: string,
  getSignal?: () => AbortSignal | undefined,
): typeof fetch {
  return async (input, init) => {
    const isRequest = input instanceof Request;
    const targetUrl =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const method = (init?.method ?? (isRequest ? input.method : "GET")).toUpperCase();
    const headers = new Headers(isRequest ? input.headers : undefined);
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    let body = init?.body;
    if (body === undefined && isRequest && method !== "GET" && method !== "HEAD") {
      body = await input.clone().arrayBuffer();
    }

    const signal = combineSignals(getSignal?.(), init?.signal);
    const proxiedUrl = buildProxiedUrl(corsProxyUrl, targetUrl);

    return globalThis.fetch(proxiedUrl, {
      ...init,
      method,
      headers,
      body,
      signal,
    });
  };
}
