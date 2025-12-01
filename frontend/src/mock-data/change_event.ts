export const changeEventData = {
  doc_id: "refund_policy_v2.md",
  old_version: "v1.3",
  new_version: "v2.0",
  timestamp: "2025-11-22T14:32:15Z",
  old_text_snippet: "Customers may request a full refund within 14 days of purchase. No questions asked. We will process the refund within 5-7 business days.",
  new_text_snippet: "Customers may request a full refund within 7 days of purchase. Refund requests must include proof of purchase. We will process the refund within 10-14 business days.",
  diff_blocks: [
    {
      type: "removed" as const,
      text: "within 14 days"
    },
    {
      type: "added" as const,
      text: "within 7 days"
    },
    {
      type: "added" as const,
      text: "Refund requests must include proof of purchase."
    },
    {
      type: "removed" as const,
      text: "No questions asked."
    },
    {
      type: "removed" as const,
      text: "within 5-7 business days"
    },
    {
      type: "added" as const,
      text: "within 10-14 business days"
    }
  ]
};
