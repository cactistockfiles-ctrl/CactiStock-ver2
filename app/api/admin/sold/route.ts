import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-server";
import { badRequest, requireAdmin } from "@/lib/api-helpers";

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id, isSold } = await req.json();
  if (!id || typeof isSold !== "boolean") {
    return badRequest("Missing id or invalid sold status");
  }

  try {
    const db = getDb();
    const docRef = db.collection("cacti").doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return badRequest("Cactus id not found");
    }

    const updateData: { isSold: boolean; soldAt?: string } = { isSold };
    if (isSold) {
      updateData.soldAt = new Date().toISOString();
    } else {
      updateData.soldAt = "";
    }

    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    const updatedData = updatedDoc.data();

    return NextResponse.json({ ok: true, item: updatedData });
  } catch (error) {
    console.error("Error updating sold status:", error);
    return badRequest("Failed to update sold status");
  }
}
