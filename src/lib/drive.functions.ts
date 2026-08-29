import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  accountInfo,
  createFile,
  driveConfigured,
  findFileId,
  readFile,
  updateFile,
} from "./drive.server";

export const loadCrmData = createServerFn({ method: "GET" }).handler(async () => {
  if (!driveConfigured()) {
    return { connected: false as const, json: null, error: "Google Drive is not connected" };
  }
  try {
    const fileId = await findFileId();
    if (!fileId) return { connected: true as const, json: null, error: null };
    const data = await readFile(fileId);
    return { connected: true as const, json: JSON.stringify(data ?? null), error: null };
  } catch (e) {
    return { connected: false as const, json: null, error: (e as Error).message };
  }
});

export const saveCrmData = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ json: z.string().max(8_000_000) }).parse(input))
  .handler(async ({ data }) => {
    if (!driveConfigured()) throw new Error("Google Drive is not connected");
    const fileId = await findFileId();
    if (fileId) {
      await updateFile(fileId, data.json);
      return { fileId, savedAt: new Date().toISOString() };
    }
    const created = await createFile(data.json);
    return { fileId: created, savedAt: new Date().toISOString() };
  });

export const driveAccount = createServerFn({ method: "GET" }).handler(async () => {
  if (!driveConfigured()) {
    return { connected: false as const, email: null, name: null, usedGb: null, error: "Google Drive is not connected" };
  }
  try {
    const info = await accountInfo();
    return { connected: true as const, ...info, error: null };
  } catch (e) {
    return { connected: false as const, email: null, name: null, usedGb: null, error: (e as Error).message };
  }
});
