import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { badRequest, requireAdmin, revalidatePublicContent } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id, status } = await req.json();
  if (!id || !status || !["available", "reserved", "sold"].includes(status)) {
    return badRequest("Missing id or invalid status");
  }

  try {
    const db = getDb();
    const docRef = db.collection("cacti").doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return badRequest("Cactus id not found");
    }

    const updateData: { status: string; isSold: boolean; soldAt?: string } = {
      status,
      isSold: false,
    };

    if (status === "sold") {
      updateData.isSold = true;
      updateData.soldAt = new Date().toISOString();
    } else {
      updateData.soldAt = "";
    }

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    // Revalidate public pages when status changes
    await revalidatePublicContent();

    return NextResponse.json({ ok: true, item: updatedData });
  } catch (error) {
    console.error("Error updating status:", error);
    return badRequest("Failed to update status");
  }
}
