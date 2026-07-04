import type { Firestore } from "firebase-admin/firestore";

const COUNTER_COLLECTION = "counters";
const ORDER_SEQUENCE_DOC = "orderSequence";

export async function reserveOrderSequence(db: Firestore) {
  const counterRef = db.collection(COUNTER_COLLECTION).doc(ORDER_SEQUENCE_DOC);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentValue = snapshot.exists ? Number(snapshot.data()?.value ?? 0) : 0;
    const nextValue = currentValue + 1;
    transaction.set(counterRef, { value: nextValue }, { merge: true });
    return nextValue;
  });
}
