# Copyright (c) 2024-present The Wayfinder Trust - Jonathan Luethke
# All Rights Reserved. Proprietary and Confidential.

"""Tests for the codebase scanner — language, framework, and test runner detection."""

from __future__ import annotations

import json

import pytest

from skillchain.tools.debugger.scanner import CodebaseScanner


@pytest.fixture
def scanner():
    return CodebaseScanner()


class TestPythonDetection:
    def test_detect_python_from_requirements(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "requirements.txt").write_text("flask==2.0\npytest\n")
        (tmp_path / "app.py").write_text("from flask import Flask\n")
        (tmp_path / "test_app.py").write_text("def test_index(): pass\n")

        info = scanner.scan(tmp_path)
        assert info.language == "python"
        assert "pytest" in (info.test_runner or "")
        assert "pytest" in (info.test_command or "")
        assert any("test_app.py" in f for f in info.test_files)

    def test_detect_python_from_pyproject(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "pyproject.toml").write_text("[tool.pytest.ini_options]\n")
        (tmp_path / "src").mkdir()
        (tmp_path / "src" / "main.py").write_text("print('hello')\n")

        info = scanner.scan(tmp_path)
        assert info.language == "python"
        assert info.test_runner == "pytest"

    def test_detect_unittest(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "setup.py").write_text("from setuptools import setup\nsetup()\n")
        (tmp_path / "test_basic.py").write_text(
            "import unittest\nclass Test(unittest.TestCase):\n    def test_x(self): pass\n"
        )

        info = scanner.scan(tmp_path)
        assert info.language == "python"
        # Should detect unittest or pytest
        assert info.test_runner in ("unittest", "pytest")

    def test_detect_conftest(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "conftest.py").write_text("import pytest\n")
        (tmp_path / "test_foo.py").write_text("def test_foo(): pass\n")

        info = scanner.scan(tmp_path)
        assert info.test_runner == "pytest"
        assert "pytest" in info.test_command

    def test_flask_framework(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "requirements.txt").write_text("flask>=2.0\n")
        (tmp_path / "app.py").write_text("from flask import Flask\n")

        info = scanner.scan(tmp_path)
        assert info.framework == "flask"

    def test_dependencies_parsed(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "requirements.txt").write_text("flask>=2.0\nrequests\npytest==7.0\n")
        (tmp_path / "app.py").write_text("")

        info = scanner.scan(tmp_path)
        assert "flask" in info.dependencies
        assert "requests" in info.dependencies
        assert "pytest" in info.dependencies


class TestJavaScriptDetection:
    def test_detect_js_from_package_json(self, scanner: CodebaseScanner, tmp_path):
        pkg = {
            "name": "my-app",
            "scripts": {"test": "jest"},
            "devDependencies": {"jest": "^29.0"},
        }
        (tmp_path / "package.json").write_text(json.dumps(pkg))
        (tmp_path / "src").mkdir()
        (tmp_path / "src" / "index.js").write_text("module.exports = {}\n")
        (tmp_path / "src" / "index.test.js").write_text("test('works', () => {})\n")

        info = scanner.scan(tmp_path)
        assert info.language in ("javascript", "typescript")
        assert info.test_runner == "jest"
        assert "jest" in info.test_command

    def test_detect_vitest(self, scanner: CodebaseScanner, tmp_path):
        pkg = {
            "name": "my-app",
            "scripts": {"test": "vitest run"},
            "devDependencies": {"vitest": "^1.0"},
        }
        (tmp_path / "package.json").write_text(json.dumps(pkg))
        (tmp_path / "vitest.config.ts").write_text("export default {}\n")
        (tmp_path / "src").mkdir()
        (tmp_path / "src" / "app.ts").write_text("export const x = 1\n")

        info = scanner.scan(tmp_path)
        assert info.test_runner == "vitest"

    def test_npm_test_fallback(self, scanner: CodebaseScanner, tmp_path):
        pkg = {
            "name": "my-app",
            "scripts": {"test": "custom-runner --all"},
        }
        (tmp_path / "package.json").write_text(json.dumps(pkg))
        (tmp_path / "index.js").write_text("")

        info = scanner.scan(tmp_path)
        assert info.test_runner == "npm"
        assert info.test_command == "npm test"

    def test_dependencies_parsed(self, scanner: CodebaseScanner, tmp_path):
        pkg = {
            "name": "my-app",
            "dependencies": {"express": "^4.0", "lodash": "^4.0"},
            "devDependencies": {"jest": "^29.0"},
        }
        (tmp_path / "package.json").write_text(json.dumps(pkg))
        (tmp_path / "index.js").write_text("")

        info = scanner.scan(tmp_path)
        assert "express" in info.dependencies
        assert "lodash" in info.dependencies
        assert "jest" in info.dependencies


class TestTypeScriptDetection:
    def test_detect_typescript(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "tsconfig.json").write_text('{"compilerOptions": {}}')
        (tmp_path / "src").mkdir()
        (tmp_path / "src" / "app.ts").write_text("const x: number = 1\n")

        info = scanner.scan(tmp_path)
        assert info.language == "typescript"


class TestRustDetection:
    def test_detect_rust(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "Cargo.toml").write_text(
            '[package]\nname = "mylib"\n[dependencies]\nserde = "1.0"\n'
        )
        (tmp_path / "src").mkdir()
        (tmp_path / "src" / "lib.rs").write_text("pub fn add(a: i32, b: i32) -> i32 { a + b }\n")

        info = scanner.scan(tmp_path)
        assert info.language == "rust"
        assert info.test_runner == "cargo test"
        assert info.test_command == "cargo test"
        assert "serde" in info.dependencies


class TestGoDetection:
    def test_detect_go(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "go.mod").write_text(
            "module example.com/myapp\n\ngo 1.21\n\nrequire (\n\tgithub.com/gin-gonic/gin v1.9\n)\n"
        )
        (tmp_path / "main.go").write_text("package main\nfunc main() {}\n")
        (tmp_path / "main_test.go").write_text("package main\nfunc TestMain(t *testing.T) {}\n")

        info = scanner.scan(tmp_path)
        assert info.language == "go"
        assert info.test_runner == "go test"
        assert info.test_command == "go test ./..."


class TestStructure:
    def test_entry_points_found(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "requirements.txt").write_text("")
        (tmp_path / "main.py").write_text("if __name__ == '__main__': pass\n")
        (tmp_path / "app.py").write_text("app = Flask(__name__)\n")

        info = scanner.scan(tmp_path)
        assert any("main.py" in ep for ep in info.entry_points)
        assert any("app.py" in ep for ep in info.entry_points)

    def test_config_files_found(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "requirements.txt").write_text("pytest\n")
        (tmp_path / "conftest.py").write_text("")
        (tmp_path / "test_foo.py").write_text("def test_x(): pass\n")

        info = scanner.scan(tmp_path)
        assert "requirements.txt" in info.config_files
        assert "conftest.py" in info.config_files

    def test_skip_dirs(self, scanner: CodebaseScanner, tmp_path):
        (tmp_path / "requirements.txt").write_text("")
        (tmp_path / "app.py").write_text("")
        nm = tmp_path / "node_modules" / "pkg"
        nm.mkdir(parents=True)
        (nm / "index.js").write_text("// should be skipped\n")

        info = scanner.scan(tmp_path)
        # node_modules files should not appear
        assert "javascript" not in info.languages_detected or info.languages_detected.get("javascript", 0) == 0

    def test_nonexistent_path_raises(self, scanner: CodebaseScanner):
        with pytest.raises(FileNotFoundError):
            scanner.scan("/nonexistent/path/xyz")
