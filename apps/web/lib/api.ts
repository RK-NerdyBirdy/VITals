import { auth } from "@/lib/auth";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

function buildUrl(path: string): string {
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = "Unexpected API error";
    try {
      const error = (await res.json()) as { detail?: string };
      detail = error.detail ?? detail;
    } catch {
      // fallback detail remains generic
    }
    throw new ApiError(res.status, detail);
  }

  return (await res.json()) as T;
}

export async function apiFetchServer<T>(path: string, init?: RequestInit): Promise<T> {
  const session = await auth();
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (session?.user?.email) {
    headers.set("X-User-Email", session.user.email);
  }
  if (session?.user?.id) {
    headers.set("X-User-Id", session.user.id);
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  return parseResponse<T>(res);
}

export async function apiFetchClient<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const { getSession } = await import("next-auth/react");
  const session = await getSession();
  if (session?.user?.email) {
    headers.set("X-User-Email", session.user.email);
  }
  if (session?.user?.id) {
    headers.set("X-User-Id", session.user.id);
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  return parseResponse<T>(res);
}
