// Document dependency graph
export const documentDependencies = {
  "refund_policy_v2.md": [
    "customer_support_faq.md",
    "terms_of_service.md",
    "product_warranty.md",
    "shipping_policy.md",
    "email_templates/refund_confirmation.html"
  ],
  "terms_of_service.md": [
    "customer_support_faq.md",
    "product_warranty.md"
  ],
  "shipping_policy.md": [
    "customer_support_faq.md",
    "email_templates/refund_confirmation.html"
  ],
  "product_warranty.md": [
    "customer_support_faq.md"
  ]
};
