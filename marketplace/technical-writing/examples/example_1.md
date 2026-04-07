# Technical Writing -- Writing a README for a CLI Tool

## Scenario

You built a CLI tool called `logslice` that filters and formats log files. You need a README.

## Applying the README Template

```markdown
# logslice

Fast log file filtering with human-readable output. Supports JSON, CSV, and plain text logs.

## Install

```bash
pip install logslice
```

## Quick Start

```bash
# Filter logs from the last hour
logslice app.log --since 1h

# Show only errors, as a table
logslice app.log --level error --format table

# Filter by field (JSON logs)
logslice app.json --where "status=500" --where "path=/api/users"

# Pipe from stdin
tail -f app.log | logslice --level warn --format compact
```

## Usage

```
logslice [FILE] [OPTIONS]

Options:
  --since DURATION     Show entries from the last DURATION (1h, 30m, 7d)
  --until DURATION     Show entries up to DURATION ago
  --level LEVEL        Filter by log level (debug, info, warn, error, fatal)
  --where FIELD=VALUE  Filter by field value (repeatable)
  --format FORMAT      Output format: table, compact, json, csv (default: compact)
  --no-color           Disable colored output
  -h, --help           Show this help
```

## API

```python
from logslice import LogSlicer

slicer = LogSlicer("app.log")
entries = slicer.filter(since="1h", level="error")

for entry in entries:
    print(entry.timestamp, entry.message)
```

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Run tests (`pytest`)
4. Submit a PR

## License

MIT
```

## Why This README Works

1. **One-sentence description**: Immediately tells you what it does
2. **Install**: Single command, copy-pasteable
3. **Quick Start**: Four real-world examples covering common use cases
4. **Usage**: Complete CLI reference with every flag explained
5. **API**: Shows it works as a library too, with a runnable example
6. **Contributing**: Short, actionable steps
7. **License**: Present and named

## Common Mistakes This Avoids

- No "Table of Contents" for a short README (unnecessary overhead)
- No "Prerequisites: Python 3.8+" buried three sections down (pip handles this)
- No screenshots of terminal output (breaks on version change)
- No "Installation from source" as the first option (pip first, source second)
- Every code block is complete and copy-pasteable
