import { getToken } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Error that preserves the HTTP status so callers can branch (e.g. 401 → /login). */
export class SurgeryViewError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "SurgeryViewError";
    this.status = status;
  }
}

/** Turn a FastAPI error body into a readable message.
 *  `detail` may be a string (404/500) or an array of `{msg}` (422). */
function parseDetail(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "detail" in data) {
    const detail = (data as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((e) =>
          e && typeof e === "object" && "msg" in e
            ? String((e as { msg: unknown }).msg)
            : JSON.stringify(e),
        )
        .join("; ");
    }
  }
  return fallback;
}

/**
 * Fetch the Surgery View for a patient by NRC or UUID.
 * Throws SurgeryViewError (with .status) on any non-2xx response.
 */
export async function fetchSurgeryView(
  nrcOrId: string,
  reason: string,
): Promise<unknown> {
  const token = getToken();
  if (!token) {
    throw new SurgeryViewError("Not authenticated", 401);
  }

  const url = `${API_BASE}/clinical-view/surgery/${encodeURIComponent(
    nrcOrId,
  )}?reason=${encodeURIComponent(reason)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new SurgeryViewError(
      parseDetail(data, `Error ${response.status}`),
      response.status,
    );
  }

  return response.json();
}
