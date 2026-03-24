import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, pipeline, history } = await request.json();

  // Forward the request to the Gnana API server's pipeline chat endpoint
  const apiUrl = process.env.NEXT_PUBLIC_GNANA_API_URL ?? "http://localhost:4000";

  try {
    const response = await fetch(`${apiUrl}/api/chat/pipeline`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use the session's access token to authenticate with the API server
        Authorization: `Bearer ${(session as unknown as Record<string, unknown>).accessToken ?? ""}`,
      },
      body: JSON.stringify({ message, pipeline, history }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return NextResponse.json(
        { error: `AI request failed: ${errorBody}` },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to connect to API: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 502 },
    );
  }
}
