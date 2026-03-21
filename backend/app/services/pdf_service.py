import io
from datetime import datetime
from reportlab.lib.pagesizes import A6
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
import logging

logger = logging.getLogger(__name__)


def generate_qr_card_pdf(
    name: str,
    sahayak_id: str,
    state: str,
    category: str,
    qr_data: str,
    issue_date: str,
    expiry_date: str,
    photo_url: str = None
) -> bytes:
    """Generate a government-style ID card PDF (A6 size)."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A6)
    width, height = A6  # 105mm x 148mm

    # Colors
    saffron = HexColor("#FF9933")
    green = HexColor("#138808")
    navy = HexColor("#000080")
    white = HexColor("#FFFFFF")

    # ── Header with tricolor ──────────────────────────
    # Saffron bar
    c.setFillColor(saffron)
    c.rect(0, height - 20 * mm, width, 8 * mm, fill=1, stroke=0)

    # White bar
    c.setFillColor(white)
    c.rect(0, height - 28 * mm, width, 8 * mm, fill=1, stroke=0)

    # Green bar
    c.setFillColor(green)
    c.rect(0, height - 36 * mm, width, 8 * mm, fill=1, stroke=0)

    # Title text
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 7)
    c.drawCentredString(width / 2, height - 17 * mm, "GOVERNMENT OF INDIA")
    c.setFont("Helvetica-Bold", 9)
    c.drawCentredString(width / 2, height - 25 * mm, "SAHAYAK CIVIC IDENTITY")
    c.setFont("Helvetica", 6)
    c.drawCentredString(width / 2, height - 33 * mm, "सहायक नागरिक पहचान पत्र")

    # ── QR Code Placeholder ──────────────────────────
    # We'll draw a bordered rect where QR goes
    qr_size = 35 * mm
    qr_x = (width - qr_size) / 2
    qr_y = height - 75 * mm
    c.setStrokeColor(navy)
    c.setLineWidth(1)
    c.rect(qr_x, qr_y, qr_size, qr_size, fill=0, stroke=1)
    c.setFont("Helvetica", 5)
    c.drawCentredString(width / 2, qr_y + qr_size / 2, "[QR CODE]")

    # ── Citizen Details ──────────────────────────
    y_pos = height - 85 * mm
    c.setFillColor(navy)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(width / 2, y_pos, name.upper() if name else "")

    y_pos -= 6 * mm
    c.setFont("Helvetica", 7)
    c.drawCentredString(width / 2, y_pos, f"Sahayak ID: {sahayak_id}")

    y_pos -= 5 * mm
    c.drawCentredString(width / 2, y_pos, f"State: {state}  |  Category: {category}")

    # ── Footer ──────────────────────────
    y_pos -= 10 * mm
    c.setFont("Helvetica", 6)
    c.drawCentredString(width / 2, y_pos, f"Issued: {issue_date}  |  Expires: {expiry_date}")

    y_pos -= 5 * mm
    c.setFont("Helvetica", 5)
    c.setFillColor(HexColor("#666666"))
    c.drawCentredString(width / 2, y_pos, "This card is digitally signed. Verify via QR scan.")

    # ── Border ──────────────────────────
    c.setStrokeColor(navy)
    c.setLineWidth(2)
    c.rect(3 * mm, 3 * mm, width - 6 * mm, height - 6 * mm, fill=0, stroke=1)

    c.save()
    return buffer.getvalue()


def generate_application_pdf(
    application_id: str,
    scheme_name: str,
    citizen_name: str,
    sahayak_id: str,
    form_data: dict,
    status: str,
    submitted_at: str
) -> bytes:
    """Generate an application summary PDF."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=(210 * mm, 297 * mm))  # A4
    width = 210 * mm
    height = 297 * mm

    navy = HexColor("#000080")
    c.setFillColor(navy)

    # Header
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 25 * mm, "SAHAYAK — Application Summary")

    c.setFont("Helvetica", 10)
    y = height - 40 * mm
    details = [
        f"Application ID: {application_id}",
        f"Scheme: {scheme_name}",
        f"Citizen: {citizen_name}",
        f"Sahayak ID: {sahayak_id}",
        f"Status: {status}",
        f"Submitted: {submitted_at}",
    ]
    for line in details:
        c.drawString(20 * mm, y, line)
        y -= 7 * mm

    # Form data
    y -= 5 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Form Data:")
    y -= 7 * mm
    c.setFont("Helvetica", 9)

    for key, value in form_data.items():
        text = f"{key}: {value}"
        if len(text) > 80:
            text = text[:80] + "..."
        c.drawString(25 * mm, y, text)
        y -= 6 * mm
        if y < 30 * mm:
            c.showPage()
            y = height - 25 * mm

    c.save()
    return buffer.getvalue()
