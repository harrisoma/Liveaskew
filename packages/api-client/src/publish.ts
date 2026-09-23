import type { Platform } from "./hashtags";

export type PublishConnection = {
  accessToken: string;
  accountId: string;
};

export type PublishResult = {
  platform: Platform;
  status: "posted" | "needs_connection" | "failed";
  detail: string;
};

type FetchImpl = typeof fetch;

function snippet(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 280);
}

async function readBody(response: Response): Promise<string> {
  return snippet(await response.text());
}

/**
 * Post one look through the network's own API.
 * Instagram and Facebook use the Graph API. TikTok uses the Content Posting API.
 * Pinterest uses Pins. LinkedIn uses the versioned Posts API.
 * A missing token never pretends the post went out.
 */
export async function publishLook(input: {
  platform: Platform;
  imageUrl: string;
  caption: string;
  connection?: PublishConnection | null;
  fetchImpl?: FetchImpl;
}): Promise<PublishResult> {
  const connection = input.connection;
  if (!connection?.accessToken || !connection.accountId) {
    return {
      platform: input.platform,
      status: "needs_connection",
      detail: `Connect ${input.platform} on Buzz. The post waits until that account is linked.`,
    };
  }
  const fetchImpl = input.fetchImpl ?? fetch;
  try {
    if (input.platform === "instagram") return await postInstagram(input, connection, fetchImpl);
    if (input.platform === "facebook") return await postFacebook(input, connection, fetchImpl);
    if (input.platform === "tiktok") return await postTikTok(input, connection, fetchImpl);
    if (input.platform === "pinterest") return await postPinterest(input, connection, fetchImpl);
    return await postLinkedIn(input, connection, fetchImpl);
  } catch (error) {
    return {
      platform: input.platform,
      status: "failed",
      detail: error instanceof Error ? error.message : "The network did not accept the post.",
    };
  }
}

async function postInstagram(
  input: { imageUrl: string; caption: string },
  connection: PublishConnection,
  fetchImpl: FetchImpl,
): Promise<PublishResult> {
  const base = `https://graph.facebook.com/v21.0/${connection.accountId}`;
  const created = await fetchImpl(`${base}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: input.imageUrl,
      caption: input.caption,
      access_token: connection.accessToken,
    }),
  });
  const createdBody = await readBody(created);
  if (!created.ok) {
    return { platform: "instagram", status: "failed", detail: createdBody };
  }
  const creationId = jsonId(createdBody);
  if (!creationId) {
    return { platform: "instagram", status: "failed", detail: createdBody };
  }
  const published = await fetchImpl(`${base}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      creation_id: creationId,
      access_token: connection.accessToken,
    }),
  });
  const publishedBody = await readBody(published);
  if (!published.ok) return { platform: "instagram", status: "failed", detail: publishedBody };
  return { platform: "instagram", status: "posted", detail: publishedBody };
}

async function postFacebook(
  input: { imageUrl: string; caption: string },
  connection: PublishConnection,
  fetchImpl: FetchImpl,
): Promise<PublishResult> {
  const response = await fetchImpl(
    `https://graph.facebook.com/v21.0/${connection.accountId}/photos`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: input.imageUrl,
        caption: input.caption,
        access_token: connection.accessToken,
      }),
    },
  );
  const detail = await readBody(response);
  return { platform: "facebook", status: response.ok ? "posted" : "failed", detail };
}

async function postTikTok(
  input: { imageUrl: string; caption: string },
  connection: PublishConnection,
  fetchImpl: FetchImpl,
): Promise<PublishResult> {
  const response = await fetchImpl("https://open.tiktokapis.com/v2/post/publish/content/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: {
        title: input.caption.slice(0, 90),
        description: input.caption,
        privacy_level: "PUBLIC_TO_EVERYONE",
      },
      source_info: {
        source: "PULL_FROM_URL",
        photo_cover_index: 0,
        photo_images: [input.imageUrl],
      },
      post_mode: "DIRECT_POST",
      media_type: "PHOTO",
    }),
  });
  const detail = await readBody(response);
  return { platform: "tiktok", status: response.ok ? "posted" : "failed", detail };
}

async function postPinterest(
  input: { imageUrl: string; caption: string },
  connection: PublishConnection,
  fetchImpl: FetchImpl,
): Promise<PublishResult> {
  const response = await fetchImpl("https://api.pinterest.com/v5/pins", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      board_id: connection.accountId,
      description: input.caption,
      media_source: { source_type: "image_url", url: input.imageUrl },
    }),
  });
  const detail = await readBody(response);
  return { platform: "pinterest", status: response.ok ? "posted" : "failed", detail };
}

async function postLinkedIn(
  input: { imageUrl: string; caption: string },
  connection: PublishConnection,
  fetchImpl: FetchImpl,
): Promise<PublishResult> {
  const headers = {
    Authorization: `Bearer ${connection.accessToken}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
    "LinkedIn-Version": "202601",
  };
  const owner = connection.accountId.startsWith("urn:")
    ? connection.accountId
    : `urn:li:person:${connection.accountId}`;
  const init = await fetchImpl("https://api.linkedin.com/rest/images?action=initializeUpload", {
    method: "POST",
    headers,
    body: JSON.stringify({ initializeUploadRequest: { owner } }),
  });
  const initBody = await readBody(init);
  if (!init.ok) return { platform: "linkedin", status: "failed", detail: initBody };
  let uploadUrl = "";
  let imageUrn = "";
  try {
    const parsed = JSON.parse(initBody) as {
      value?: { uploadUrl?: string; image?: string };
    };
    uploadUrl = parsed.value?.uploadUrl ?? "";
    imageUrn = parsed.value?.image ?? "";
  } catch {
    return { platform: "linkedin", status: "failed", detail: initBody };
  }
  if (!uploadUrl || !imageUrn) {
    return { platform: "linkedin", status: "failed", detail: initBody };
  }
  const image = await fetchImpl(input.imageUrl);
  if (!image.ok) {
    return { platform: "linkedin", status: "failed", detail: "The look image could not be read." };
  }
  const uploaded = await fetchImpl(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      "Content-Type": image.headers.get("content-type") ?? "image/jpeg",
    },
    body: await image.arrayBuffer(),
  });
  if (!uploaded.ok) {
    return { platform: "linkedin", status: "failed", detail: await readBody(uploaded) };
  }
  const posted = await fetchImpl("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers,
    body: JSON.stringify({
      author: owner,
      commentary: input.caption,
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED" },
      content: { media: { id: imageUrn } },
      lifecycleState: "PUBLISHED",
    }),
  });
  const detail = await readBody(posted);
  return { platform: "linkedin", status: posted.ok ? "posted" : "failed", detail };
}

function jsonId(body: string): string | null {
  try {
    const parsed = JSON.parse(body) as { id?: string };
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
}

export function isDue(
  look: { status: string; scheduledFor: string | null },
  now = new Date(),
): boolean {
  if (look.status !== "scheduled" || !look.scheduledFor) return false;
  return new Date(look.scheduledFor).getTime() <= now.getTime();
}
