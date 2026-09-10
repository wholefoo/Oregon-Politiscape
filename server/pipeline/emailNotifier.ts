import { Resend } from "resend";

let connectionSettings: any;

async function getCredentials(): Promise<{ apiKey: string; fromEmail: string }> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }

  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return { client: new Resend(apiKey), fromEmail };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendErrorNotification(
  status: "error" | "partial",
  errorMessage: string,
  articlesGenerated: number,
  dbEmail?: string | null
): Promise<void> {
  const toEmail = dbEmail || process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!toEmail) {
    console.log("[pipeline] No notification email configured — skipping error notification");
    return;
  }

  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const siteUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0].trim()}`
      : "http://localhost:5000";

    const adminUrl = `${siteUrl}/admin`;

    const isPartial = status === "partial";
    const subject = isPartial
      ? `[Oregon Politiscape] Pipeline completed with errors (${articlesGenerated} draft${articlesGenerated === 1 ? "" : "s"} saved)`
      : `[Oregon Politiscape] Pipeline run failed — action may be required`;

    const statusLabel = isPartial ? "Partial Failure" : "Pipeline Error";
    const statusColor = isPartial ? "#d97706" : "#dc2626";
    const summaryText = isPartial
      ? `The pipeline completed but encountered errors. <strong>${articlesGenerated} draft article${articlesGenerated === 1 ? "" : "s"}</strong> were saved; some items failed to generate.`
      : `The pipeline run failed entirely. No new drafts were created.`;

    const html = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a2332;">
        <div style="background:#1a2332;padding:20px 24px;">
          <h1 style="color:#f59e0b;margin:0;font-size:22px;">Oregon Politiscape</h1>
        </div>
        <div style="padding:24px;">
          <div style="display:inline-block;background:${statusColor};color:#fff;font-weight:bold;font-size:13px;padding:4px 10px;border-radius:3px;margin-bottom:16px;">${statusLabel}</div>
          <h2 style="margin-top:0;">Pipeline Run Alert</h2>
          <p>${summaryText}</p>
          <div style="background:#fef2f2;border-left:4px solid ${statusColor};padding:12px 16px;margin:20px 0;border-radius:2px;">
            <strong style="display:block;margin-bottom:6px;color:${statusColor};">Error details:</strong>
            <code style="font-size:13px;color:#7f1d1d;white-space:pre-wrap;">${escapeHtml(errorMessage)}</code>
          </div>
          <p style="margin-top:24px;">
            <a href="${adminUrl}" style="display:inline-block;background:#f59e0b;color:#1a2332;font-weight:bold;padding:12px 24px;text-decoration:none;border-radius:4px;">
              Open Admin Panel
            </a>
          </p>
          <p style="font-size:13px;color:#666;margin-top:32px;">This alert was sent because you are configured as the site administrator. To stop receiving these emails, clear the notification email in the admin Pipeline settings (or remove the ADMIN_NOTIFICATION_EMAIL environment variable if no database value is set).</p>
        </div>
      </div>
    `;

    const from = fromEmail || "noreply@oregonpolitiscape.com";
    const { error } = await client.emails.send({
      from,
      to: [toEmail],
      subject,
      html,
    });

    if (error) {
      console.error("[pipeline] Failed to send error notification email:", error);
    } else {
      console.log(`[pipeline] Error notification email sent to ${toEmail}`);
    }
  } catch (err: any) {
    console.error("[pipeline] Error sending error notification email:", err.message);
  }
}

export async function sendDraftNotification(articleTitles: string[], dbEmail?: string | null): Promise<void> {
  const toEmail = dbEmail || process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!toEmail) {
    console.log("[pipeline] No notification email configured — skipping email notification");
    return;
  }

  if (articleTitles.length === 0) {
    return;
  }

  try {
    const { client, fromEmail } = await getUncachableResendClient();

    const siteUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : process.env.REPLIT_DOMAINS
      ? `https://${process.env.REPLIT_DOMAINS.split(",")[0].trim()}`
      : "http://localhost:5000";

    const adminUrl = `${siteUrl}/admin`;
    const count = articleTitles.length;
    const subject = `[Oregon Politiscape] ${count} new AI draft${count === 1 ? "" : "s"} ready for review`;

    const titleListHtml = articleTitles
      .map((t) => `<li style="margin-bottom:6px;">${escapeHtml(t)}</li>`)
      .join("\n");

    const html = `
      <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a2332;">
        <div style="background:#1a2332;padding:20px 24px;">
          <h1 style="color:#f59e0b;margin:0;font-size:22px;">Oregon Politiscape</h1>
        </div>
        <div style="padding:24px;">
          <h2 style="margin-top:0;">New AI Drafts Ready for Review</h2>
          <p>The content pipeline just completed a run and generated <strong>${count} new draft article${count === 1 ? "" : "s"}</strong> awaiting your review:</p>
          <ul style="padding-left:20px;line-height:1.7;">
            ${titleListHtml}
          </ul>
          <p style="margin-top:24px;">
            <a href="${adminUrl}" style="display:inline-block;background:#f59e0b;color:#1a2332;font-weight:bold;padding:12px 24px;text-decoration:none;border-radius:4px;">
              Review in Admin Panel
            </a>
          </p>
          <p style="font-size:13px;color:#666;margin-top:32px;">This notification was sent because you are configured as the site administrator. To stop receiving these emails, clear the notification email in the admin Pipeline settings (or remove the ADMIN_NOTIFICATION_EMAIL environment variable if no database value is set).</p>
        </div>
      </div>
    `;

    const from = fromEmail || "noreply@oregonpolitiscape.com";
    const { error } = await client.emails.send({
      from,
      to: [toEmail],
      subject,
      html,
    });

    if (error) {
      console.error("[pipeline] Failed to send draft notification email:", error);
    } else {
      console.log(`[pipeline] Draft notification email sent to ${toEmail}`);
    }
  } catch (err: any) {
    console.error("[pipeline] Error sending draft notification email:", err.message);
  }
}
