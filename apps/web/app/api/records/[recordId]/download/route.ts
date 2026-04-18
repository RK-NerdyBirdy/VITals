import { auth } from "@/lib/auth";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

type RouteContext = {
  params: {
    recordId: string;
  };
};

export async function GET(_: Request, context: RouteContext): Promise<Response> {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const headers = new Headers();
  headers.set("X-User-Email", session.user.email);
  if (session.user.id) {
    headers.set("X-User-Id", session.user.id);
  }

  const upstream = await fetch(`${API_URL}/api/records/${context.params.recordId}/download`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!upstream.ok) {
    let detail = "Unable to stream record";
    try {
      const payload = (await upstream.json()) as { detail?: string };
      detail = payload.detail ?? detail;
    } catch {
      // Keep generic fallback detail.
    }

    return Response.json({ detail }, { status: upstream.status });
  }

  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  const contentDisposition = upstream.headers.get("content-disposition");

  if (contentType) {
    responseHeaders.set("content-type", contentType);
  }
  if (contentDisposition) {
    responseHeaders.set("content-disposition", contentDisposition);
  }
  responseHeaders.set("cache-control", "no-store");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}
