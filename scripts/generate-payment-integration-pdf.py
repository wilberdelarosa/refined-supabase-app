from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "GUIA_INTEGRACION_PAGOS_AZUL_CARDNET.md"
OUTPUT = ROOT / "output" / "pdf" / "Guia-Integracion-Pagos-Azul-CardNET.pdf"

NAVY = colors.HexColor("#071521")
BLUE = colors.HexColor("#0369A1")
SKY = colors.HexColor("#E0F2FE")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#526276")
LINE = colors.HexColor("#D8E3EA")
SOFT = colors.HexColor("#F4F8FA")
GREEN = colors.HexColor("#047857")


def register_fonts() -> tuple[str, str]:
    candidates = [
        (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf")),
        (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"), Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")),
    ]
    for regular, bold in candidates:
        if regular.exists() and bold.exists():
            pdfmetrics.registerFont(TTFont("GuideSans", str(regular)))
            pdfmetrics.registerFont(TTFont("GuideSansBold", str(bold)))
            return "GuideSans", "GuideSansBold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()


def inline_markup(value: str) -> str:
    escaped = html.escape(value.strip())
    escaped = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="#0369A1"><u>\1</u></link>',
        escaped,
    )
    escaped = re.sub(r"`([^`]+)`", r'<font name="Courier" color="#075985">\1</font>', escaped)
    escaped = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", escaped)
    return escaped


def make_styles():
    base = getSampleStyleSheet()
    return {
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.3,
            leading=13.2,
            textColor=INK,
            spaceAfter=5,
        ),
        "h1": ParagraphStyle(
            "H1",
            parent=base["Heading1"],
            fontName=FONT_BOLD,
            fontSize=21,
            leading=25,
            textColor=NAVY,
            spaceBefore=14,
            spaceAfter=10,
            keepWithNext=1,
        ),
        "h2": ParagraphStyle(
            "H2",
            parent=base["Heading2"],
            fontName=FONT_BOLD,
            fontSize=14.5,
            leading=18,
            textColor=BLUE,
            spaceBefore=13,
            spaceAfter=7,
            keepWithNext=1,
        ),
        "h3": ParagraphStyle(
            "H3",
            parent=base["Heading3"],
            fontName=FONT_BOLD,
            fontSize=11.5,
            leading=15,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=5,
            keepWithNext=1,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.2,
            leading=13,
            leftIndent=14,
            firstLineIndent=-9,
            textColor=INK,
            spaceAfter=3,
        ),
        "quote": ParagraphStyle(
            "Quote",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.2,
            leading=13,
            leftIndent=12,
            rightIndent=8,
            borderColor=colors.HexColor("#F59E0B"),
            borderWidth=1.5,
            borderPadding=(7, 9, 7, 10),
            backColor=colors.HexColor("#FFFBEB"),
            textColor=colors.HexColor("#7C2D12"),
            spaceBefore=5,
            spaceAfter=8,
        ),
        "code": ParagraphStyle(
            "Code",
            fontName="Courier",
            fontSize=7.6,
            leading=10.4,
            textColor=NAVY,
            backColor=colors.HexColor("#E8F3F8"),
            borderPadding=9,
            leftIndent=0,
            rightIndent=0,
            spaceBefore=4,
            spaceAfter=8,
        ),
        "cover_kicker": ParagraphStyle(
            "CoverKicker",
            fontName=FONT_BOLD,
            fontSize=10,
            leading=13,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#38BDF8"),
            spaceAfter=12,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            fontName=FONT_BOLD,
            fontSize=30,
            leading=35,
            alignment=TA_CENTER,
            textColor=colors.white,
            spaceAfter=16,
        ),
        "cover_subtitle": ParagraphStyle(
            "CoverSubtitle",
            fontName=FONT,
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#D7EFFB"),
            leftIndent=14 * mm,
            rightIndent=14 * mm,
            spaceAfter=20,
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            fontName=FONT,
            fontSize=10,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#D7EFFB"),
        ),
        "table": ParagraphStyle(
            "TableCell",
            fontName=FONT,
            fontSize=7.4,
            leading=9.5,
            textColor=INK,
        ),
        "table_head": ParagraphStyle(
            "TableHead",
            fontName=FONT_BOLD,
            fontSize=7.6,
            leading=9.8,
            textColor=colors.white,
            alignment=TA_LEFT,
        ),
    }


STYLES = make_styles()


def draw_page(canvas, document):
    width, height = A4
    canvas.saveState()
    if document.page == 1:
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, width, height, stroke=0, fill=1)
        canvas.setStrokeColor(colors.HexColor("#23516A"))
        canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
        canvas.setFont(FONT, 7.5)
        canvas.setFillColor(colors.HexColor("#BAE6FD"))
        canvas.drawString(18 * mm, 9 * mm, "Documento de activacion y certificacion")
        canvas.drawRightString(width - 18 * mm, 9 * mm, "Pagina 1")
        canvas.restoreState()
        return
    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 16 * mm, width, 16 * mm, stroke=0, fill=1)
    canvas.setFont(FONT_BOLD, 8.2)
    canvas.setFillColor(colors.white)
    canvas.drawString(18 * mm, height - 10 * mm, "BARBARO NUTRITION  /  PAGOS DIGITALES")
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 14 * mm, width - 18 * mm, 14 * mm)
    canvas.setFont(FONT, 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9 * mm, "Guia operativa - Azul, CardNET y links de pago")
    canvas.drawRightString(width - 18 * mm, 9 * mm, f"Pagina {document.page}")
    canvas.restoreState()


def cover_story():
    status_data = [
        [Paragraph("CAPA", STYLES["table_head"]), Paragraph("ESTADO", STYLES["table_head"])],
        [Paragraph("Aplicacion y checkout", STYLES["table"]), Paragraph("Preparado", STYLES["table"])],
        [Paragraph("Base de datos y callbacks", STYLES["table"]), Paragraph("Preparado", STYLES["table"])],
        [Paragraph("Activacion bancaria", STYLES["table"]), Paragraph("Requiere credenciales y certificacion", STYLES["table"])],
    ]
    table = Table(status_data, colWidths=[62 * mm, 82 * mm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, LINE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return [
        Spacer(1, 33 * mm),
        Paragraph("BÁRBARO NUTRITION", STYLES["cover_kicker"]),
        Paragraph("Integración de pagos con Azul y CardNET", STYLES["cover_title"]),
        Paragraph(
            "Guía secuencial para activar tarjetas de crédito, débito y links de pago con facturación, inventario, correo y control administrativo.",
            STYLES["cover_subtitle"],
        ),
        Spacer(1, 5 * mm),
        table,
        Spacer(1, 18 * mm),
        Paragraph("Preparado el 15 de julio de 2026", STYLES["cover_meta"]),
        Paragraph("Versión técnica para certificación y despliegue", STYLES["cover_meta"]),
        PageBreak(),
    ]


def markdown_table(lines: list[str]) -> Table:
    parsed = []
    for index, line in enumerate(lines):
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if index == 1 and all(re.fullmatch(r":?-{3,}:?", cell) for cell in cells):
            continue
        style = STYLES["table_head"] if not parsed else STYLES["table"]
        parsed.append([Paragraph(inline_markup(cell), style) for cell in cells])
    column_count = max(len(row) for row in parsed)
    usable = 174 * mm
    widths = [usable / column_count] * column_count
    if column_count == 3:
        widths = [43 * mm, 39 * mm, 92 * mm]
    if column_count == 2:
        widths = [55 * mm, 119 * mm]
    table = Table(parsed, colWidths=widths, repeatRows=1, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, SOFT]),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


def markdown_story(text: str):
    lines = text.splitlines()
    story = []
    index = 0
    paragraph_lines: list[str] = []

    def flush_paragraph():
        if paragraph_lines:
            story.append(Paragraph(inline_markup(" ".join(paragraph_lines)), STYLES["body"]))
            paragraph_lines.clear()

    while index < len(lines):
        line = lines[index].rstrip()
        stripped = line.strip()

        if index == 0 and stripped.startswith("# "):
            index += 1
            continue
        if stripped.startswith("**Proyecto:") or stripped.startswith("**Fecha de preparación:") or stripped.startswith("**Objetivo:"):
            index += 1
            continue
        if not stripped:
            flush_paragraph()
            index += 1
            continue
        if stripped.startswith("```"):
            flush_paragraph()
            code_lines = []
            index += 1
            while index < len(lines) and not lines[index].strip().startswith("```"):
                code_lines.append(lines[index].rstrip())
                index += 1
            story.append(Preformatted("\n".join(code_lines), STYLES["code"] ))
            index += 1
            continue
        if stripped.startswith("|"):
            flush_paragraph()
            table_lines = []
            while index < len(lines) and lines[index].strip().startswith("|"):
                table_lines.append(lines[index])
                index += 1
            story.append(markdown_table(table_lines))
            story.append(Spacer(1, 6))
            continue
        if stripped.startswith("### "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[4:]), STYLES["h3"]))
            index += 1
            continue
        if stripped.startswith("## "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[3:]), STYLES["h2"]))
            index += 1
            continue
        if stripped.startswith("# "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[2:]), STYLES["h1"]))
            index += 1
            continue
        if stripped.startswith("> "):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[2:]), STYLES["quote"]))
            index += 1
            continue
        if re.match(r"^- ", stripped):
            flush_paragraph()
            story.append(Paragraph(inline_markup(stripped[2:]), STYLES["bullet"], bulletText="-"))
            index += 1
            continue
        numbered = re.match(r"^(\d+)\.\s+(.*)$", stripped)
        if numbered:
            flush_paragraph()
            story.append(Paragraph(inline_markup(numbered.group(2)), STYLES["bullet"], bulletText=f"{numbered.group(1)}."))
            index += 1
            continue

        paragraph_lines.append(stripped)
        index += 1

    flush_paragraph()
    return story


def build_pdf():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    page_width, page_height = A4
    frame = Frame(
        18 * mm,
        18 * mm,
        page_width - 36 * mm,
        page_height - 38 * mm,
        id="content",
        topPadding=7 * mm,
        bottomPadding=4 * mm,
        leftPadding=0,
        rightPadding=0,
    )
    document = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=20 * mm,
        bottomMargin=18 * mm,
        title="Guia de integracion de pagos Azul y CardNET",
        author="Barbaro Nutrition",
        subject="Activacion de pagos, facturacion, correo y administracion",
    )
    document.addPageTemplates([PageTemplate(id="guide", frames=[frame], onPage=draw_page)])
    story = cover_story() + markdown_story(SOURCE.read_text(encoding="utf-8"))
    document.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build_pdf()
