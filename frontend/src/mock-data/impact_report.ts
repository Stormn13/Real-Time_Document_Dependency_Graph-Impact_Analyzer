export const impactReportData = [
  {
    doc_id: "customer_support_faq.md",
    severity: "HIGH" as const,
    issue_summary: "FAQ states '14-day refund window' but policy now allows only 7 days",
    suggested_rewrite: "Update FAQ answer to: 'You can request a refund within 7 days of purchase. Please include your proof of purchase when submitting your refund request.'",
    impacted_section: "Section 3: Refunds and Returns - Question: 'How long do I have to request a refund?'"
  },
  {
    doc_id: "terms_of_service.md",
    severity: "HIGH" as const,
    issue_summary: "Terms reference '14-day money-back guarantee' which contradicts new 7-day policy",
    suggested_rewrite: "Update Section 8.2 to: 'We offer a 7-day money-back guarantee from the date of purchase. All refund requests must be accompanied by proof of purchase and will be processed within 10-14 business days.'",
    impacted_section: "Section 8.2: Money-Back Guarantee"
  },
  {
    doc_id: "product_warranty.md",
    severity: "MEDIUM" as const,
    issue_summary: "Warranty doc mentions '14-day satisfaction guarantee' alongside warranty terms",
    suggested_rewrite: "Change footnote to: '*Subject to our 7-day refund policy. Warranty coverage begins after the refund period expires.'",
    impacted_section: "Footer note on page 2"
  },
  {
    doc_id: "shipping_policy.md",
    severity: "LOW" as const,
    issue_summary: "Minor inconsistency: states 'refunds processed in 5-7 days' but new policy says 10-14 days",
    suggested_rewrite: "Update processing timeline to: 'Approved refunds are processed within 10-14 business days and will appear in your original payment method.'",
    impacted_section: "Returns and Refunds subsection"
  },
  {
    doc_id: "email_templates/refund_confirmation.html",
    severity: "MEDIUM" as const,
    issue_summary: "Email template promises '5-7 business days' processing but policy now states 10-14 days",
    suggested_rewrite: "Update email copy to: 'Your refund has been approved and will be processed within 10-14 business days. Thank you for providing proof of purchase.'",
    impacted_section: "Confirmation message body"
  }
];
