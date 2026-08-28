const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
export const FILE_NAME = "devs-crm-data.json";

function headers() {
  const lovable = process.env["LOVABLE_API_KEY"];
  const drive = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovable || !drive) throw new Error("Google Drive is not connected");
  return {
    Authorization: `Bearer ${lovable}`,
    "X-Connection-Api-Key": drive,
  };
}

export function driveConfigured() {
  return Boolean(process.env["LOVABLE_API_KEY"] && process.env["GOOGLE_DRIVE_API_KEY"]);
}

async function ok(res: Response, what: string) {
  if (!res.ok) {
    const body = await res.text();
    console.error(`Drive ${what} failed [${res.status}]: ${body}`);
    throw new Error(`Drive ${what} failed [${res.status}]: ${body}`);
  }
  return res;
}

export async function findFileId(): Promise<string | null> {
  const url = new URL(`${GATEWAY}/drive/v3/files`);
  url.searchParams.set("q", `name='${FILE_NAME}' and trashed=false`);
  url.searchParams.set("fields", "files(id,name,modifiedTime)");
  url.searchParams.set("pageSize", "10");
  const res = await ok(await fetch(url, { headers: headers() }), "search");
  const json = (await res.json()) as { files?: Array<{ id: string }> };
  return json.files?.[0]?.id ?? null;
}

export async function readFile(fileId: string): Promise<unknown> {
  const res = await ok(
    await fetch(`${GATEWAY}/drive/v3/files/${fileId}?alt=media`, { headers: headers() }),
    "download",
  );
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function createFile(content: string): Promise<string> {
  const boundary = "crmboundary" + Date.now();
  const metadata = JSON.stringify({ name: FILE_NAME, mimeType: "application/json" });
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
    `--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n` +
    `--${boundary}--`;
  const res = await ok(
    await fetch(`${GATEWAY}/upload/drive/v3/files?uploadType=multipart&fields=id`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    }),
    "create",
  );
  const json = (await res.json()) as { id: string };
  return json.id;
}

export async function updateFile(fileId: string, content: string) {
  await ok(
    await fetch(`${GATEWAY}/upload/drive/v3/files/${fileId}?uploadType=media`, {
      method: "PATCH",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: content,
    }),
    "update",
  );
}
