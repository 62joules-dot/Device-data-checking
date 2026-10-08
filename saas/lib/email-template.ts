// Email-safe HTML template for the "Emails" page: table layout + inline styles
// only, so it survives a copy-paste into Gmail and renders the same when sent
// through the API.

export type EmailLink = { label: string; url: string };

export type EmailContent = {
  title: string;
  subtitle: string;
  photoUrl: string | null;
  intro: string;
  specs: [string, string][];
  price: string | null;
  description: string;
  links: EmailLink[];
  outro: string;
  signatureName: string;
  contactPhone: string;
  contactEmail: string;
};

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Plain text with line breaks → escaped HTML paragraphs.
function paragraphs(text: string, style: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

const FONT = "font-family:Arial,Helvetica,sans-serif;";
const TEXT = `${FONT}margin:0 0 14px;font-size:15px;line-height:1.6;color:#3f3f46;`;
const ACCENT = "#2563eb";

export function renderEmailHtml(c: EmailContent) {
  const specsRows = c.specs
    .map(
      ([k, v], i) => `<tr>
  <td style="${FONT}padding:9px 14px;font-size:13px;color:#71717a;background:${i % 2 ? "#ffffff" : "#f4f4f5"};width:40%;">${esc(k)}</td>
  <td style="${FONT}padding:9px 14px;font-size:13px;color:#18181b;font-weight:bold;background:${i % 2 ? "#ffffff" : "#f4f4f5"};">${esc(v)}</td>
</tr>`
    )
    .join("");

  const linkButtons = c.links
    .map(
      (l) => `<a href="${esc(l.url)}" target="_blank" style="${FONT}display:inline-block;margin:0 8px 8px 0;padding:11px 20px;border-radius:8px;background:${ACCENT};color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;">${esc(l.label)}</a>`
    )
    .join("");

  const contactLine = [c.contactPhone && esc(c.contactPhone), c.contactEmail && `<a href="mailto:${esc(c.contactEmail)}" style="color:${ACCENT};text-decoration:none;">${esc(c.contactEmail)}</a>`]
    .filter(Boolean)
    .join(" · ");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
  <tr><td style="${FONT}background:#18181b;padding:18px 28px;font-size:18px;font-weight:bold;color:#ffffff;">62<span style="color:#60a5fa;">joules</span></td></tr>
  ${c.photoUrl ? `<tr><td><img src="${esc(c.photoUrl)}" alt="${esc(c.title)}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>` : ""}
  <tr><td style="padding:28px 28px 8px;">
    <h1 style="${FONT}margin:0 0 4px;font-size:24px;line-height:1.3;color:#18181b;">${esc(c.title)}</h1>
    ${c.subtitle ? `<p style="${FONT}margin:0 0 20px;font-size:14px;color:#71717a;">${esc(c.subtitle)}</p>` : ""}
    ${paragraphs(c.intro, TEXT)}
  </td></tr>
  ${c.price ? `<tr><td style="padding:0 28px 20px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eff6ff;border-radius:10px;"><tr>
      <td style="${FONT}padding:16px 20px;font-size:13px;color:#1e40af;text-transform:uppercase;letter-spacing:1px;">Prix</td>
      <td align="right" style="${FONT}padding:16px 20px;font-size:22px;font-weight:bold;color:#1e3a8a;">${esc(c.price)}</td>
    </tr></table>
  </td></tr>` : ""}
  ${specsRows ? `<tr><td style="padding:0 28px 20px;">
    <p style="${FONT}margin:0 0 8px;font-size:13px;font-weight:bold;color:#18181b;text-transform:uppercase;letter-spacing:1px;">Caractéristiques</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-radius:8px;overflow:hidden;">${specsRows}</table>
  </td></tr>` : ""}
  ${c.description.trim() ? `<tr><td style="padding:0 28px 8px;">${paragraphs(c.description, TEXT)}</td></tr>` : ""}
  ${linkButtons ? `<tr><td style="padding:0 28px 12px;">${linkButtons}</td></tr>` : ""}
  <tr><td style="padding:8px 28px 28px;">
    ${paragraphs(c.outro, TEXT)}
    <p style="${FONT}margin:0;font-size:15px;line-height:1.6;color:#18181b;">Bien cordialement,<br><strong>${esc(c.signatureName)}</strong></p>
    ${contactLine ? `<p style="${FONT}margin:4px 0 0;font-size:13px;color:#71717a;">${contactLine}</p>` : ""}
  </td></tr>
  <tr><td style="${FONT}background:#fafafa;border-top:1px solid #e4e4e7;padding:14px 28px;font-size:11px;color:#a1a1aa;">Matériel médical et esthétique d'occasion · 62joules</td></tr>
</table>
</td></tr>
</table>`;
}

// Plain-text alternative, sent alongside the HTML part.
export function renderEmailText(c: EmailContent) {
  return [
    c.title,
    c.subtitle,
    c.intro,
    c.price ? `Prix : ${c.price}` : "",
    c.specs.length ? c.specs.map(([k, v]) => `- ${k} : ${v}`).join("\n") : "",
    c.description,
    c.links.map((l) => `${l.label} : ${l.url}`).join("\n"),
    c.outro,
    `Bien cordialement,\n${c.signatureName}`,
    [c.contactPhone, c.contactEmail].filter(Boolean).join(" · "),
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .join("\n\n");
}
