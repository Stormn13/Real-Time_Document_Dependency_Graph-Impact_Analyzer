from rag.llm_runner import run_llm

def main():
    fake_event = {
        "changed_doc": "RefundPolicy",
        "summary": "Refund window changed from 14 days to 7 days.",
        "old_snippets": [
            "Customers may request a refund within 14 days of purchase."
        ],
        "new_snippets": [
            "Customers may request a refund within 7 days of purchase."
        ],
        "impacted_docs": {
            "FAQ_Refunds": [
                "Refunds are available for up to 14 days."
            ],
            "Support_Script": [
                "Tell the customer they can request refunds within 14 days."
            ]
        }
    }

    out = run_llm(fake_event)
    print("=== LLM RESULT ===")
    print(out)

if __name__ == "__main__":
    main()
