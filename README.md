# Real-Time Document Dependency Graph & Impact Analyzer

A production-grade streaming pipeline that monitors Markdown documents for changes, detects semantic shifts, builds a real-time dependency graph, and uses LLM analysis to identify impacted documents.

## 📋 Overview

**What it does:**
- **File Watching**: Monitors `docs/` folder for real-time Markdown file changes.
- **Change Detection**: Splits documents into semantic paragraphs, computes MD5 hashes, detects removed/added content.
- **Dependency Graph**: Scans documents for explicit filename references and implicit keyword signals; uses semantic embeddings (sentence-transformers) to find related documents.
- **Impact Analysis**: Determines which documents are impacted by a change and retrieves relevant snippets.
- **LLM Integration**: Sends structured change events to Google Gemini API for analysis; returns severity and suggested rewrites.
- **JSON Output**: Emits canonical JSON events for downstream systems (UI, alerts, etc.).

---

## 🚀 Quick Start

### 1. Install WSL (Windows Subsystem for Linux)

If you don't have WSL installed:

```powershell
# In Windows PowerShell (as Administrator)
wsl --install
# or
wsl --install -d Ubuntu
```

Then restart your computer and follow the Ubuntu setup prompts.

### 2. Verify WSL is Running

```bash
# In WSL terminal
wsl --list --verbose
# Should show Ubuntu or your distro as running
```

### 3. Access Your Repository in WSL

WSL automatically mounts Windows drives under `/mnt/`. Your repo at `D:\work\health-test\...` is accessible as:

```bash
cd /mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer
```

**Why `/mnt/d/`?**
- `D:` drive → `/mnt/d/`
- `C:` drive → `/mnt/c/`
- Use lowercase drive letter.

### 4. Set Up Python Environment

Create and activate a virtual environment (recommended to isolate dependencies):

```bash
cd /mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer
python3 -m venv .venv
source .venv/bin/activate
```

On WSL, you should see `(.venv)` prefix in your prompt.

### 5. Upgrade pip

```bash
python -m pip install --upgrade pip setuptools wheel
```

### 6. Install Dependencies

The repo includes a `requirements.txt` with all needed packages. Some packages (like `torch` for sentence-transformers) are large:

```bash
pip install --break-system-packages -r requirements.txt
```

**What gets installed:**
- `watchdog`: file system monitoring
- `python-dotenv`: load environment variables from `.env`
- `google-generativeai`: Gemini API client
- `sentence-transformers`: local embedding model (90MB download)
- `numpy`: numerical library

**Installation time:** ~2-5 minutes (sentence-transformers downloads a ~90MB model on first use).

### 7. Set Up Google Gemini API Key

Get a Gemini API key:
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key (free tier available).
3. Copy the key.

Then, in WSL, create a `.env` file in the repo root:

```bash
cat > .env <<'EOF'
GOOGLE_API_KEY=ya29.your_actual_key_here
EOF
```

Or export it per-session:

```bash
export GOOGLE_API_KEY="ya29.your_actual_key_here"
```

### 8. Configure Watcher Paths

Set the directory to watch (or a single file):

```bash
# Watch the entire docs folder
export DOCS_PATH=/mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer/docs

# OR watch a single file
export DOCS_PATH=/mnt/d/work/document\ watcher/refund_policy.md
```

### 9. Enable Polling and LLM

Because you're editing files on a Windows-mounted drive (`/mnt/`), enable polling for reliability:

```bash
export USE_POLLING=1      # Force polling observer (needed for /mnt/ mounts)
export RUN_LLM=1          # Enable LLM calls (set to 0 to disable)
```

### 10. Run the Watcher

```bash
python3 doc_watcher.py
```

Expected output:

```
Watching /mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer/docs for changes (fallback mode, observer=PollingObserver)
```

Now, whenever you edit or save a `.md` file in `docs/`, you should see:

```
Detected file system event: modified /mnt/d/.../docs/RefundPolicy.md
{"changed_doc": "RefundPolicy.md", "summary": "Changed numeric value from 7 to 14", "old_snippets": [...], "new_snippets": [...], "impacted_docs": {...}}
LLM result: {"summary": "...", "severity": "low", "impacted_docs": [...]}
```

---

## 📦 One-Line Setup (Copy & Paste)

If you have WSL with Python 3.8+ already installed:

```bash
cd /mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer && \
python3 -m venv .venv && \
source .venv/bin/activate && \
python -m pip install --upgrade pip setuptools wheel && \
pip install --break-system-packages -r requirements.txt && \
export DOCS_PATH=/mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer/docs && \
export GOOGLE_API_KEY="your-key-here" && \
export RUN_LLM=1 && \
export USE_POLLING=1 && \
python3 doc_watcher.py
```

Replace `your-key-here` with your actual Gemini API key.

---

## 🔧 Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `DOCS_PATH` | Directory or file to watch | `/mnt/d/.../docs` or `/mnt/d/.../docs/RefundPolicy.md` |
| `DOCS_DIR` | (Fallback) Directory to watch if `DOCS_PATH` not set | `/mnt/d/.../docs` |
| `USE_POLLING` | Force polling observer (needed for `/mnt/` drives) | `1` (yes) or `0` (no) |
| `RUN_LLM` | Enable LLM analysis calls | `1` (yes) or `0` (no) |
| `GOOGLE_API_KEY` | Gemini API key (from Google AI Studio) | `ya29.your_key` |

**Persistent Configuration:**
Add to `~/.bashrc` in WSL:

```bash
echo 'export DOCS_PATH=/mnt/d/work/health-test/Real-Time_Document_Dependency_Graph-Impact_Analyzer/docs' >> ~/.bashrc
echo 'export USE_POLLING=1' >> ~/.bashrc
echo 'export RUN_LLM=1' >> ~/.bashrc
source ~/.bashrc
```

---

## 📄 JSON Change Event Schema

When a document changes, the watcher emits a JSON event (one line per change):

```json
{
  "changed_doc": "RefundPolicy.md",
  "summary": "Changed numeric value from 7 to 14",
  "old_snippets": ["We offer 7-day refunds for all purchases"],
  "new_snippets": ["We offer 14-day refunds for all purchases"],
  "impacted_docs": {
    "FAQ_Refunds.md": ["Our 14-day refund policy ensures customer satisfaction"],
    "Support_Script.md": ["Check if purchase is within 14-day refund window"]
  }
}
```

**Fields:**
- `changed_doc`: Filename that was modified.
- `summary`: Human-readable one-line summary of the change.
- `old_snippets`: Paragraphs that were removed.
- `new_snippets`: Paragraphs that were added.
- `impacted_docs`: Map of dependent documents and relevant snippets from those docs.

---

## 🧠 LLM Analysis Output

When `RUN_LLM=1`, the watcher calls Google Gemini to analyze the change:

```json
{
  "summary": "Refund period reduced from 14 to 7 days",
  "severity": "high",
  "impacted_docs": ["FAQ_Refunds.md", "Support_Script.md"]
}
```

Or, if LLM is blocked or fails gracefully:

```json
{
  "summary": "Gemini blocked response (reason: SAFETY)",
  "severity": "low",
  "impacted_docs": []
}
```

---

## 🔍 How the Dependency Graph Works

1. **Explicit References**: Scans all documents for filename mentions (e.g., "RefundPolicy.md").
2. **Implicit Keywords**: Matches document name parts (e.g., "FAQ_Refunds.md" matches "Refunds" keyword).
3. **Semantic Similarity**: Uses sentence-transformers to compute embeddings; finds paragraphs in other docs semantically similar to changed content (threshold: 0.70 cosine similarity).

Result: A list of (from_doc, to_doc, ref_type, confidence) tuples.

---

## 📁 Project Structure

```
.
├── doc_watcher.py           # Main watcher script
├── requirements.txt         # Python dependencies
├── README.md                # This file
├── schema.md                # JSON schema specification
├── docs/                    # Markdown documents to monitor
│   ├── RefundPolicy.md
│   ├── FAQ_Refunds.md
│   ├── Support_Script.md
│   └── Support_Workflow.md
├── rag/                     # LLM and document indexing
│   ├── __init__.py
│   ├── llm_runner.py        # Gemini API integration
│   ├── prompts.py           # LLM prompt builder
│   └── doc_index.py         # Sentence-transformers embedding index
└── .cache/                  # (Auto-created) Stores embeddings and state
    ├── prev_paragraphs.json
    └── embeddings.npz
```

---

## 🐛 Troubleshooting

### WSL Not Installed
```powershell
# In Windows PowerShell (as Administrator)
wsl --install -d Ubuntu
```

### Python Not Found in WSL
```bash
python3 --version
# If not found, install:
sudo apt update
sudo apt install python3 python3-venv python3-pip
```

### File Changes Not Detected
- Confirm `USE_POLLING=1` is set (required for `/mnt/` mounts).
- Check that `DOCS_PATH` matches the path you're editing:
  ```bash
  realpath /mnt/d/path/to/file.md
  # Compare with DOCS_PATH value
  echo $DOCS_PATH
  ```
- Try restarting the watcher.

### LLM Call Fails
- Ensure `GOOGLE_API_KEY` is set and valid:
  ```bash
  echo $GOOGLE_API_KEY
  ```
- Check billing is enabled in your Google Cloud project.
- If safety-filtered, the watcher will return a graceful fallback (no crash).
- Disable LLM to test the watcher alone:
  ```bash
  export RUN_LLM=0
  python3 doc_watcher.py
  ```

### sentence-transformers Installation Fails
- May need `torch` installed first (heavy download). Try:
  ```bash
  pip install torch --index-url https://download.pytorch.org/whl/cpu
  pip install sentence-transformers
  ```
- Or skip embeddings by commenting out the semantic link code in `doc_watcher.py`.

### "No module named 'watchdog'"
```bash
# Ensure venv is activated
source .venv/bin/activate
pip install watchdog
```

---

## 🚀 Running in Background (Production)

To run the watcher continuously and log output:

```bash
nohup python3 -u doc_watcher.py > watcher.log 2>&1 &
# Check logs
tail -f watcher.log
# Stop
jobs -l
kill <PID>
```

Or use systemd service (advanced).

---

## 📚 Key Files

- **`doc_watcher.py`**: Main entry point. Watches, detects changes, builds dependency graph, calls LLM.
- **`rag/llm_runner.py`**: Interfaces with Google Gemini API. Handles response parsing and error handling.
- **`rag/prompts.py`**: Constructs LLM prompts from change events.
- **`rag/doc_index.py`**: Sentence-transformers wrapper for semantic similarity search.
- **`requirements.txt`**: Python package dependencies.

---

## 🔐 Security Notes

- **API Key**: Store `GOOGLE_API_KEY` in `.env` (added to `.gitignore`) or use environment-level secrets.
- **Snippet Redaction**: LLM calls send change summaries and snippets to Google. Consider redacting PII before sending.
- **Rate Limiting**: The LLM is called once per document change when `RUN_LLM=1`. Monitor your Gemini API quota.

---

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section above.
2. Verify all env vars are set correctly: `echo $DOCS_PATH $RUN_LLM $GOOGLE_API_KEY`
3. Test the watcher without LLM: `export RUN_LLM=0; python3 doc_watcher.py`
4. Check logs in `.cache/` or console output for errors.

---

## 📖 Next Steps

1. Add more documents to `docs/` to build a richer dependency graph.
2. Integrate the watcher into a CI/CD pipeline or scheduled job.
3. Set up UI/alert system to consume the JSON events from stdout.
4. Customize LLM prompts in `rag/prompts.py` for your use case.
5. Deploy to production using Pathway (see `Productionize Pathway pipeline` TODO).

---

**Happy documenting! 📝**
