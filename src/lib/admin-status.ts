export async function fetchAdminStatus(accessToken: string): Promise<boolean> {
  if (!accessToken) return false;

  try {
    const response = await fetch("/api/admin-status", {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return false;

    const data = (await response.json()) as { isAdmin?: boolean };
    return data.isAdmin === true;
  } catch {
    return false;
  }
}
