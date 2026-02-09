import { NextResponse } from "next/server";
import { deleteAnalysis, getAnalysis } from "../../../../db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  const analysis = getAnalysis(id);
  if (!analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data: analysis });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  deleteAnalysis(id);
  return NextResponse.json({ ok: true });
}
