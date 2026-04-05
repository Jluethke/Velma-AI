# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.

"""Tests for the error parser — Python, JavaScript, Rust, Go tracebacks."""

from __future__ import annotations

import pytest

from skillchain.debugger.error_parser import ErrorParser, ParsedError


@pytest.fixture
def parser():
    return ErrorParser()


# -- Python tracebacks --------------------------------------------------------

PYTHON_TRACEBACK = """\
Traceback (most recent call last):
  File "app/main.py", line 42, in run
    result = compute(data)
  File "app/compute.py", line 17, in compute
    return data["value"] / data["divisor"]
ZeroDivisionError: division by zero
"""

PYTHON_IMPORT_ERROR = """\
Traceback (most recent call last):
  File "app/main.py", line 1, in <module>
    import nonexistent_module
ModuleNotFoundError: No module named 'nonexistent_module'
"""

PYTHON_SYNTAX_ERROR = """\
  File "app/broken.py", line 10
    def foo(
           ^
SyntaxError: unexpected EOF while parsing
"""

PYTHON_TYPE_ERROR = """\
Traceback (most recent call last):
  File "test_stuff.py", line 5, in test_add
    result = add(1, "two")
  File "stuff.py", line 2, in add
    return a + b
TypeError: unsupported operand type(s) for +: 'int' and 'str'
"""

PYTHON_ASSERTION_ERROR = """\
Traceback (most recent call last):
  File "test_math.py", line 8, in test_divide
    assert divide(10, 0) == 0
  File "math_utils.py", line 5, in divide
    return a / b
ZeroDivisionError: division by zero
"""


class TestPythonParsing:
    def test_zero_division(self, parser: ErrorParser):
        result = parser.parse(PYTHON_TRACEBACK)
        assert result.error_type == "ZeroDivisionError"
        assert result.message == "division by zero"
        assert result.language == "python"
        assert result.category == "runtime"
        assert result.file_path == "app/compute.py"
        assert result.line_number == 17
        assert len(result.stack_frames) == 2

    def test_stack_frames(self, parser: ErrorParser):
        result = parser.parse(PYTHON_TRACEBACK)
        frame0 = result.stack_frames[0]
        assert frame0.file == "app/main.py"
        assert frame0.line == 42
        assert frame0.function == "run"
        assert frame0.code == "result = compute(data)"

        frame1 = result.stack_frames[1]
        assert frame1.file == "app/compute.py"
        assert frame1.line == 17
        assert frame1.function == "compute"

    def test_import_error(self, parser: ErrorParser):
        result = parser.parse(PYTHON_IMPORT_ERROR)
        assert result.error_type == "ModuleNotFoundError"
        assert "nonexistent_module" in result.message
        assert result.category == "import"
        assert result.language == "python"

    def test_syntax_error(self, parser: ErrorParser):
        result = parser.parse(PYTHON_SYNTAX_ERROR)
        assert result.error_type == "SyntaxError"
        assert result.category == "syntax"
        assert result.file_path == "app/broken.py"
        assert result.line_number == 10

    def test_type_error(self, parser: ErrorParser):
        result = parser.parse(PYTHON_TYPE_ERROR)
        assert result.error_type == "TypeError"
        assert result.category == "type"
        assert "unsupported operand" in result.message

    def test_assertion_in_test(self, parser: ErrorParser):
        result = parser.parse(PYTHON_ASSERTION_ERROR)
        assert result.error_type == "ZeroDivisionError"
        assert result.category == "runtime"
        assert result.file_path == "math_utils.py"
        assert result.line_number == 5


# -- JavaScript errors -------------------------------------------------------

JS_ERROR = """\
TypeError: Cannot read properties of undefined (reading 'map')
    at processItems (/app/src/utils.js:15:23)
    at main (/app/src/index.js:42:10)
    at Object.<anonymous> (/app/src/index.js:50:1)
"""

JS_REFERENCE_ERROR = """\
ReferenceError: foo is not defined
    at bar (/app/src/lib.js:10:5)
"""


class TestJavaScriptParsing:
    def test_type_error(self, parser: ErrorParser):
        result = parser.parse(JS_ERROR)
        assert result.error_type == "TypeError"
        assert "Cannot read properties of undefined" in result.message
        assert result.language in ("javascript", "typescript")
        assert result.file_path == "/app/src/utils.js"
        assert result.line_number == 15
        assert len(result.stack_frames) == 3

    def test_reference_error(self, parser: ErrorParser):
        result = parser.parse(JS_REFERENCE_ERROR)
        assert result.error_type == "ReferenceError"
        assert "foo" in result.message
        assert result.file_path == "/app/src/lib.js"
        assert result.line_number == 10

    def test_stack_frame_parsing(self, parser: ErrorParser):
        result = parser.parse(JS_ERROR)
        frame = result.stack_frames[0]
        assert frame.file == "/app/src/utils.js"
        assert frame.line == 15
        assert frame.function == "processItems"


# -- TypeScript errors --------------------------------------------------------

TS_ERROR = """\
src/app.ts(12,5): error TS2322: Type 'string' is not assignable to type 'number'.
"""


class TestTypeScriptParsing:
    def test_ts_compiler_error(self, parser: ErrorParser):
        result = parser.parse(TS_ERROR, language="typescript")
        assert result.error_type == "TS2322"
        assert "Type 'string'" in result.message
        assert result.file_path == "src/app.ts"
        assert result.line_number == 12
        assert result.column == 5
        assert result.category == "type"


# -- Rust errors --------------------------------------------------------------

RUST_ERROR = """\
error[E0308]: mismatched types
 --> src/main.rs:42:10
  |
42|     let x: i32 = "hello";
  |                  ^^^^^^^ expected `i32`, found `&str`
"""


class TestRustParsing:
    def test_compiler_error(self, parser: ErrorParser):
        result = parser.parse(RUST_ERROR)
        assert result.error_type == "E0308"
        assert "mismatched types" in result.message
        assert result.language == "rust"
        assert result.file_path == "src/main.rs"
        assert result.line_number == 42
        assert result.column == 10


# -- Go errors ----------------------------------------------------------------

GO_ERROR = """\
./main.go:15:3: undefined: someFunction
"""

GO_PANIC = """\
panic: runtime error: index out of range [5] with length 3

goroutine 1 [running]:
main.process()
	/app/main.go:25 +0x80
main.main()
	/app/main.go:10 +0x20
"""


class TestGoParsing:
    def test_compile_error(self, parser: ErrorParser):
        result = parser.parse(GO_ERROR, language="go")
        assert result.file_path == "./main.go"
        assert result.line_number == 15
        assert "undefined" in result.message

    def test_panic(self, parser: ErrorParser):
        result = parser.parse(GO_PANIC, language="go")
        assert result.error_type == "Panic"
        assert "index out of range" in result.message
        assert len(result.stack_frames) >= 2


# -- Language detection -------------------------------------------------------

class TestLanguageDetection:
    def test_detects_python(self, parser: ErrorParser):
        result = parser.parse(PYTHON_TRACEBACK)
        assert result.language == "python"

    def test_detects_javascript(self, parser: ErrorParser):
        result = parser.parse(JS_ERROR)
        assert result.language in ("javascript", "typescript")

    def test_detects_rust(self, parser: ErrorParser):
        result = parser.parse(RUST_ERROR)
        assert result.language == "rust"

    def test_detects_go(self, parser: ErrorParser):
        result = parser.parse(GO_PANIC, language="go")
        assert result.language == "go"


# -- Test summary parsing ----------------------------------------------------

class TestSummaryParsing:
    def test_pytest_summary(self, parser: ErrorParser):
        output = "===== 3 passed, 2 failed, 1 error in 1.5s ====="
        result = parser.parse_test_summary(output, "python")
        assert result["passed"] == 3
        assert result["failed"] == 2
        assert result["errors"] == 1
        assert result["total"] == 6

    def test_jest_summary(self, parser: ErrorParser):
        output = "Tests:  2 failed, 5 passed, 7 total"
        result = parser.parse_test_summary(output, "javascript")
        assert result["passed"] == 5
        assert result["failed"] == 2
        assert result["total"] == 7

    def test_cargo_summary(self, parser: ErrorParser):
        output = "test result: ok. 10 passed; 0 failed; 2 ignored; 0 measured"
        result = parser.parse_test_summary(output, "rust")
        assert result["passed"] == 10
        assert result["failed"] == 0
        assert result["skipped"] == 2

    def test_empty_output(self, parser: ErrorParser):
        result = parser.parse_test_summary("", "python")
        assert result["total"] == 0

    def test_empty_error_text(self, parser: ErrorParser):
        result = parser.parse("")
        assert result.error_type == "Unknown"

    def test_none_error_text(self, parser: ErrorParser):
        result = parser.parse(None)
        assert result.error_type == "Unknown"
