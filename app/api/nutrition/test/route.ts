import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: "Test route working!" });
}

export async function GET() {
  return NextResponse.json({ message: "GET test route working!" });
}
