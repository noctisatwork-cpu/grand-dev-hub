import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM = `You are the assistant inside "Dev's CRM", a CRM for Foundrix (AI & SaaS consulting) and The Grand Standard (a ₹25,000 / 3-month 1:1 mentorship).
You turn the user's plain-language request into CRM records.

Reply ONLY with a JSON object (no markdown fences) shaped like:
{"reply":"short confirmation for the user","actions":[...]}

Each action is one of:
{"type":"add_lead","name":"","business":"","businessType":"Agency|AI-SaaS|Freelancer|Ecommerce|Content Creator","email":"","phone":"","handle":"","source":"Instagram DM|LinkedIn|Discord partnership|Referral|Cold outreach|Substack|Other","status":"New Lead|Contacted|Call Booked|Proposal Sent|Negotiating|Won/Client|Lost","notes":""}
{"type":"add_client","name":"","business":"","program":"The Grand Standard|Consulting retainer|Other","startDate":"YYYY-MM-DD","months":3,"paymentStatus":"Paid|Partial|Pending","amount":25000,"guaranteeActive":true}
{"type":"add_task","title":"","dueDate":"YYYY-MM-DD"}
{"type":"add_content","kind":"Content|Partnership","platform":"Instagram|LinkedIn|X|Substack|Discord|Other","date":"YYYY-MM-DD","topic":"","link":"","notes":""}
{"type":"update_lead_status","name":"","status":"..."}

Rules: infer sensible defaults, leave unknown text fields as "". Create several actions when the user lists several people. If the user only asks a question, return an empty actions array and answer in "reply". Keep "reply" under 30 words.`;

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        message: z.string().min(1).max(8000),
        context: z.string().max(4000).default(""),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: `Today is ${new Date().toISOString().slice(0, 10)}.\nCurrent CRM summary: ${data.context || "empty"}\n\nRequest: ${data.message}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`AI gateway failed [${res.status}]: ${body}`);
      if (res.status === 429) throw new Error("Too many requests — try again in a moment.");
      if (res.status === 402) throw new Error("AI credits are exhausted. Add credits in Lovable to continue.");
      throw new Error(`AI request failed (${res.status})`);
    }

    const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = json.choices?.[0]?.message?.content ?? "";
    return { raw: text };
  });
