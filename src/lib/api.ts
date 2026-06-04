import { supabase } from "@/integrations/supabase/client";

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init.headers);
  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function readApiJson<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(text.slice(0, 160) || `Server returned ${response.status}`);
    }
  }

  if (!response.ok || data?.error) {
    throw new Error(data?.error || `Server returned ${response.status}`);
  }

  return data as T;
}
