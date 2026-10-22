# Concrete Word Replacer

Third pass: replace every abstract word with a concrete one. 'Significant cost savings' becomes '$340K annually.' 'Soon' becomes 'by March 15.' Abstract words let the reader fill in their own meaning, which is usually wrong.

## Inputs

- `trimmed-draft`: The draft after cutting non-essential sentences

## Outputs

- `concrete-draft`: The draft with abstract words replaced by specific, measurable language
- `abstraction-log`: Abstract words replaced and their concrete replacements

## Process

1. Search for abstract quantity words: 'significant,' 'substantial,' 'many,' 'some,' 'various,' 'several.' Replace with numbers.
2. Search for abstract time words: 'soon,' 'shortly,' 'in the near future,' 'eventually.' Replace with dates.
3. Search for abstract quality words: 'improved,' 'better,' 'enhanced,' 'streamlined.' Replace with what specifically changed and by how much.
4. Test: could two readers disagree about what a sentence means? If yes, it contains an abstraction. Make it specific.

---

Copyright 2024-present The Wayfinder Trust. All rights reserved.
