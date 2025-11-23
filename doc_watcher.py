import pathway as pw

# 1. Create a table that watches a text file
table = pw.io.fs.read(
    "./data.txt",
    format="text",     # treat file as text
    mode="streaming",  # keep watching for changes
)

# 2. React to updates in real time
@pw.udf
def print_change(line: str):
    print("Detected change:", line)
    return line

processed = table.select(
    changed=print_change(pw.this.data)
)

# 3. Run the pipeline
pw.run()
