#!/bin/bash
# Build and publish skillchain to PyPI
set -e

echo "Building skillchain package..."
python -m build

echo ""
echo "Built artifacts:"
ls -la dist/

echo ""
echo "To publish to PyPI:"
echo "  python -m twine upload dist/*"
echo ""
echo "To publish to Test PyPI first:"
echo "  python -m twine upload --repository testpypi dist/*"
