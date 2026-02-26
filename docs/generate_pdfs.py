#!/usr/bin/env python3
"""Generate PDFs from markdown lore documents using fpdf2 + markdown."""

import markdown
import re
import os
from html.parser import HTMLParser
from fpdf import FPDF

DOCS_DIR = os.path.dirname(os.path.abspath(__file__))


def sanitize_text(text):
    """Replace Unicode characters that cause encoding issues."""
    replacements = {
        '\u2014': '--',   # em dash
        '\u2013': '-',    # en dash
        '\u2018': "'",    # left single quote
        '\u2019': "'",    # right single quote
        '\u201c': '"',    # left double quote
        '\u201d': '"',    # right double quote
        '\u2026': '...',  # ellipsis
        '\u2022': '*',    # bullet
        '\u2192': '->',   # right arrow
        '\u2194': '<->',  # double arrow
        '\u2500': '-',    # box drawing
        '\u2502': '|',    # box drawing vertical
        '\u00d7': 'x',    # multiplication sign
        '\u2212': '-',    # minus sign
    }
    for char, replacement in replacements.items():
        text = text.replace(char, replacement)
    # Strip any remaining non-latin1 characters
    return text.encode('latin-1', 'replace').decode('latin-1')


class MarkdownPDF(FPDF):
    """Custom PDF with DnD manual styling."""

    def __init__(self, title=""):
        super().__init__()
        self.doc_title = title
        self.set_auto_page_break(auto=True, margin=25)

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(100, 80, 60)
            self.cell(0, 8, self.doc_title, align='C')
            self.ln(4)
            self.set_draw_color(180, 160, 130)
            self.line(20, self.get_y(), self.w - 20, self.get_y())
            self.ln(6)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(120, 100, 80)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')


class MDToFPDF(HTMLParser):
    """Parse markdown-converted HTML and render to FPDF."""

    def __init__(self, pdf):
        super().__init__()
        self.pdf = pdf
        self.style_stack = []
        self.current_text = ""
        self.in_table = False
        self.in_thead = False
        self.table_row = []
        self.table_cols = 0
        self.in_blockquote = False
        self.in_li = False
        self.list_depth = 0
        self.skip_tag = set()

    def flush_text(self):
        text = sanitize_text(self.current_text.strip())
        if not text:
            self.current_text = ""
            return

        if self.in_table:
            self.table_row.append(text)
            self.current_text = ""
            return

        self.current_text = ""

        if self.in_blockquote:
            self.pdf.set_font('Helvetica', 'I', 10)
            self.pdf.set_text_color(80, 60, 40)
            x = self.pdf.get_x()
            self.pdf.set_x(25)
            self.pdf.set_draw_color(139, 69, 19)
            self.pdf.line(22, self.pdf.get_y(), 22, self.pdf.get_y() + 5)
            self.pdf.multi_cell(self.pdf.w - 50, 5, text)
            self.pdf.set_text_color(26, 26, 26)
            self.pdf.ln(2)
            return

        if self.in_li:
            self.pdf.set_font('Helvetica', '', 10)
            self.pdf.set_text_color(26, 26, 26)
            indent = 15 + (self.list_depth - 1) * 8
            bullet = "-" if self.list_depth == 1 else "  -"
            self.pdf.set_x(indent)
            self.pdf.cell(6, 5, bullet)
            self.pdf.multi_cell(self.pdf.w - indent - 25, 5, text)
            self.pdf.ln(1)
            return

        self.pdf.set_font('Helvetica', '', 10)
        self.pdf.set_text_color(26, 26, 26)
        self.pdf.multi_cell(0, 5, text)
        self.pdf.ln(2)

    def handle_starttag(self, tag, attrs):
        self.flush_text()

        if tag == 'h1':
            if self.pdf.page_no() > 0:
                self.pdf.add_page()
            self.style_stack.append('h1')
        elif tag == 'h2':
            self.pdf.ln(6)
            self.style_stack.append('h2')
        elif tag == 'h3':
            self.pdf.ln(4)
            self.style_stack.append('h3')
        elif tag == 'h4':
            self.pdf.ln(3)
            self.style_stack.append('h4')
        elif tag == 'p':
            pass
        elif tag == 'strong':
            self.style_stack.append('strong')
        elif tag == 'em':
            self.style_stack.append('em')
        elif tag == 'blockquote':
            self.in_blockquote = True
        elif tag == 'table':
            self.in_table = True
            self.table_cols = 0
        elif tag == 'thead':
            self.in_thead = True
        elif tag == 'tbody':
            self.in_thead = False
        elif tag == 'tr':
            self.table_row = []
        elif tag in ('th', 'td'):
            pass
        elif tag == 'ul':
            self.list_depth += 1
        elif tag == 'ol':
            self.list_depth += 1
        elif tag == 'li':
            self.in_li = True
        elif tag == 'hr':
            self.pdf.ln(3)
            self.pdf.set_draw_color(180, 160, 130)
            self.pdf.line(20, self.pdf.get_y(), self.pdf.w - 20, self.pdf.get_y())
            self.pdf.ln(5)
        elif tag == 'br':
            self.pdf.ln(3)

    def handle_endtag(self, tag):
        self.flush_text()

        if tag == 'h1':
            text = sanitize_text(self.current_text.strip())
            self.style_stack.pop() if 'h1' in self.style_stack else None
            self.pdf.set_font('Helvetica', 'B', 22)
            self.pdf.set_text_color(44, 24, 16)
            self.pdf.multi_cell(0, 9, text if text else "")
            self.pdf.set_draw_color(139, 69, 19)
            self.pdf.line(10, self.pdf.get_y() + 1, self.pdf.w - 10, self.pdf.get_y() + 1)
            self.pdf.ln(6)
            self.current_text = ""
        elif tag == 'h2':
            text = sanitize_text(self.current_text.strip())
            self.style_stack.pop() if 'h2' in self.style_stack else None
            self.pdf.set_font('Helvetica', 'B', 16)
            self.pdf.set_text_color(74, 44, 10)
            self.pdf.multi_cell(0, 7, text if text else "")
            self.pdf.set_draw_color(200, 168, 130)
            self.pdf.line(10, self.pdf.get_y(), self.pdf.w - 10, self.pdf.get_y())
            self.pdf.ln(4)
            self.current_text = ""
        elif tag == 'h3':
            text = sanitize_text(self.current_text.strip())
            self.style_stack.pop() if 'h3' in self.style_stack else None
            self.pdf.set_font('Helvetica', 'B', 13)
            self.pdf.set_text_color(90, 58, 26)
            self.pdf.multi_cell(0, 6, text if text else "")
            self.pdf.ln(3)
            self.current_text = ""
        elif tag == 'h4':
            text = sanitize_text(self.current_text.strip())
            self.style_stack.pop() if 'h4' in self.style_stack else None
            self.pdf.set_font('Helvetica', 'B', 11)
            self.pdf.set_text_color(106, 74, 42)
            self.pdf.multi_cell(0, 5, text if text else "")
            self.pdf.ln(2)
            self.current_text = ""
        elif tag == 'p':
            self.pdf.ln(1)
        elif tag == 'strong':
            self.style_stack.pop() if 'strong' in self.style_stack else None
        elif tag == 'em':
            self.style_stack.pop() if 'em' in self.style_stack else None
        elif tag == 'blockquote':
            self.in_blockquote = False
            self.pdf.ln(2)
        elif tag == 'tr':
            if self.table_row:
                if self.table_cols == 0:
                    self.table_cols = max(len(self.table_row), 1)
                col_w = (self.pdf.w - 30) / self.table_cols
                if self.in_thead:
                    self.pdf.set_font('Helvetica', 'B', 9)
                    self.pdf.set_fill_color(60, 36, 21)
                    self.pdf.set_text_color(250, 245, 239)
                    for cell in self.table_row:
                        self.pdf.cell(col_w, 6, sanitize_text(cell[:40]), border=1, fill=True)
                    self.pdf.ln()
                else:
                    self.pdf.set_font('Helvetica', '', 9)
                    self.pdf.set_text_color(26, 26, 26)
                    max_lines = 1
                    for cell in self.table_row:
                        lines = max(1, len(cell) // 35 + 1)
                        max_lines = max(max_lines, lines)
                    row_h = max_lines * 5
                    x_start = self.pdf.get_x()
                    y_start = self.pdf.get_y()
                    if y_start + row_h > self.pdf.h - 25:
                        self.pdf.add_page()
                        y_start = self.pdf.get_y()
                    for i, cell in enumerate(self.table_row):
                        self.pdf.set_xy(x_start + i * col_w, y_start)
                        self.pdf.multi_cell(col_w, 5, sanitize_text(cell[:120]), border=1)
                    self.pdf.set_xy(x_start, y_start + row_h)
                self.table_row = []
        elif tag == 'table':
            self.in_table = False
            self.in_thead = False
            self.table_cols = 0
            self.pdf.ln(3)
        elif tag == 'ul' or tag == 'ol':
            self.list_depth = max(0, self.list_depth - 1)
            self.pdf.ln(2)
        elif tag == 'li':
            self.in_li = False

    def handle_data(self, data):
        self.current_text += data

    def handle_entityref(self, name):
        char_map = {'amp': '&', 'lt': '<', 'gt': '>', 'quot': '"', 'mdash': '-', 'ndash': '-'}
        self.current_text += char_map.get(name, f'&{name};')


def md_to_pdf(md_path, pdf_path, title=""):
    """Convert a markdown file to styled PDF."""
    print(f"Converting: {os.path.basename(md_path)} -> {os.path.basename(pdf_path)}")

    with open(md_path, 'r', encoding='utf-8') as f:
        md_content = f.read()

    html_content = markdown.markdown(
        md_content,
        extensions=['tables', 'fenced_code']
    )

    pdf = MarkdownPDF(title=title)
    pdf.add_page()

    # Title page
    pdf.set_font('Helvetica', 'B', 32)
    pdf.set_text_color(44, 24, 16)
    pdf.ln(40)
    pdf.multi_cell(0, 14, title, align='C')
    pdf.ln(10)
    pdf.set_draw_color(139, 69, 19)
    pdf.line(40, pdf.get_y(), pdf.w - 40, pdf.get_y())
    pdf.ln(10)
    pdf.set_font('Helvetica', 'I', 12)
    pdf.set_text_color(100, 80, 60)
    pdf.cell(0, 8, "A World Reference Document", align='C')
    pdf.ln(6)
    pdf.cell(0, 8, "February 2026", align='C')

    pdf.add_page()

    parser = MDToFPDF(pdf)
    parser.feed(html_content)
    parser.flush_text()

    pdf.output(pdf_path)
    size_kb = os.path.getsize(pdf_path) / 1024
    print(f"  Done: {size_kb:.0f} KB, {pdf.page_no()} pages")


if __name__ == '__main__':
    summary_md = os.path.join(DOCS_DIR, 'LORE_SUMMARY.md')
    summary_pdf = os.path.join(DOCS_DIR, 'LORE_SUMMARY.pdf')

    manual_md = os.path.join(DOCS_DIR, 'AGE_AFTER_WAR_WORLD_MANUAL.md')
    manual_pdf = os.path.join(DOCS_DIR, 'AGE_AFTER_WAR_WORLD_MANUAL.pdf')

    if os.path.exists(summary_md):
        md_to_pdf(summary_md, summary_pdf, "Age After War - Lore Summary")
    else:
        print(f"Missing: {summary_md}")

    if os.path.exists(manual_md):
        md_to_pdf(manual_md, manual_pdf, "The Age After War - World Manual")
    else:
        print(f"Missing: {manual_md}")

    print("\nPDF generation complete.")
