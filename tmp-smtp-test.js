const fs = require("fs");
const nodemailer = require("nodemailer");

const env = fs
  .readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .filter(Boolean)
  .reduce((acc, line) => {
    if (line.trim().startsWith("#")) return acc;
    const idx = line.indexOf("=");
    if (idx === -1) return acc;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    acc[key] = value;
    return acc;
  }, {});

if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.SMTP_FROM) {
  console.error("Missing SMTP configuration in .env");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: Number(env.SMTP_PORT || 587),
  secure: Number(env.SMTP_PORT || 587) === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error("ERROR", err && err.message ? err.message : err);
    process.exit(1);
  }

  console.log("OK", success);
  process.exit(0);
});
