import { NextResponse } from "next/server";

export function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "private, max-age=5, stale-while-revalidate=30"
    }
  });
}
