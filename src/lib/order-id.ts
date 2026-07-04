export function zeroPad(value: number, width = 2) {
  return String(value).padStart(width, "0");
}

const MAX_SEQUENCE_PER_LETTER = 99999;
const ALPHABET_SIZE = 26;

export function formatOrderSuffix(sequence: number) {
  const normalized = Math.max(1, Math.floor(sequence));
  const letterIndex = Math.floor((normalized - 1) / MAX_SEQUENCE_PER_LETTER);
  const serial = ((normalized - 1) % MAX_SEQUENCE_PER_LETTER) + 1;
  const letter = String.fromCharCode(65 + Math.min(letterIndex, ALPHABET_SIZE - 1));
  return `${letter}${String(serial).padStart(5, "0")}`;
}

export function generateOrderId(sequence = 1) {
  const now = new Date();
  const hhmm = `${zeroPad(now.getHours())}${zeroPad(now.getMinutes())}`;
  const ddmmyyyy = `${zeroPad(now.getDate())}${zeroPad(now.getMonth() + 1)}${now.getFullYear()}`;
  const suffix = formatOrderSuffix(sequence);
  return `cactistock-${hhmm}-${ddmmyyyy}-${suffix}`;
}
