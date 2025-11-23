import pathway as pw

# 1. Create a table that watches a text file
table = pw.io.fs.read(
    "/mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer/docs/RefundPolicy.md",
    format="plaintext",     # treat file as text
    mode="streaming",  # keep watching for changes
    with_snapshot=True, 
)

# 2. React to updates in real time
@pw.udf
def print_change(line: str):
    print("Detected change:", line)
    return line

processed = table.select(
    changed=print_change(pw.this.data)
)

pw.io.csv.write(processed, "/tmp/out.csv")

# 3. Run the pipeline
pw.run()
