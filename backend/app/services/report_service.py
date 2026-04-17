from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.platypus import HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
from app.schemas.schemas import SolarAnalysisResponse

ORANGE = HexColor("#F97316")
YELLOW = HexColor("#FCD34D")
BLUE = HexColor("#38BDF8")
GREEN = HexColor("#4ADE80")
DARK = HexColor("#0F172A")
SLATE = HexColor("#334155")
LIGHT = HexColor("#F1F5F9")


def generate_pdf_report(analysis: SolarAnalysisResponse) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        rightMargin=2*cm, leftMargin=2*cm,
        topMargin=2*cm, bottomMargin=2*cm
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"],
                                  textColor=ORANGE, fontSize=24, spaceAfter=6)
    h2_style = ParagraphStyle("H2", parent=styles["Heading2"],
                               textColor=BLUE, fontSize=14, spaceBefore=12, spaceAfter=4)
    body_style = ParagraphStyle("Body", parent=styles["Normal"],
                                 textColor=SLATE, fontSize=10, spaceAfter=4)
    center_style = ParagraphStyle("Center", parent=styles["Normal"],
                                   alignment=TA_CENTER, textColor=SLATE, fontSize=10)

    story = []

    # Header
    story.append(Paragraph("SolarScope", title_style))
    story.append(Paragraph("Rooftop Solar Potential Report", styles["Heading2"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}", body_style))
    if analysis.address:
        story.append(Paragraph(f"Location: {analysis.address}", body_style))
    story.append(Paragraph(f"Coordinates: {analysis.lat:.5f}°, {analysis.lon:.5f}°", body_style))
    story.append(HRFlowable(width="100%", thickness=2, color=ORANGE, spaceAfter=12))

    # Solar Score
    story.append(Paragraph("Solar Suitability Score", h2_style))
    score_data = [["Score", "Rating", "Recommendation"]]
    score = analysis.solar_score
    rating = "Excellent" if score >= 80 else "Good" if score >= 60 else "Average" if score >= 40 else "Poor"
    rec = ("Highly recommended" if score >= 80 else
           "Recommended" if score >= 60 else
           "Consider carefully" if score >= 40 else "Not recommended")
    score_data.append([f"{score}/100", rating, rec])
    score_table = Table(score_data, colWidths=[4*cm, 5*cm, 9*cm])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("GRID", (0, 0), (-1, -1), 0.5, black),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 12))

    # System Specs
    story.append(Paragraph("System Specifications", h2_style))
    spec_data = [
        ["Parameter", "Value"],
        ["Total Roof Area", f"{analysis.roof_area_m2:.1f} m²"],
        ["Usable Roof Area", f"{analysis.usable_area_m2:.1f} m²"],
        ["Number of Panels", f"{analysis.num_panels} panels"],
        ["System Capacity", f"{analysis.system_capacity_kwp:.2f} kWp"],
        ["Annual Generation", f"{analysis.annual_generation_kwh:,.0f} kWh/year"],
        ["Solar Irradiance (GHI)", f"{analysis.irradiance.ghi:.2f} kWh/m²/day"],
        ["PVOUT", f"{analysis.irradiance.pvout:.0f} kWh/kWp/year"],
    ]
    
    if analysis.prediction_source == "model_image":
        if analysis.roof_orientation:
            spec_data.append(["Roof Orientation", analysis.roof_orientation.capitalize()])
        if analysis.roof_tilt_degrees is not None:
            spec_data.append(["Estimated Tilt", f"{analysis.roof_tilt_degrees:.1f}°"])
        if analysis.shading_factor is not None:
            spec_data.append(["Shading Factor", f"{(analysis.shading_factor * 100):.0f}%"])
        if analysis.model_confidence is not None:
            spec_data.append(["Detection Confidence", f"{(analysis.model_confidence * 100):.1f}%"])
            
    spec_table = Table(spec_data, colWidths=[9*cm, 9*cm])
    spec_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, black),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(spec_table)
    story.append(Spacer(1, 12))

    # Financial Summary
    story.append(Paragraph("Financial Analysis", h2_style))
    currency = analysis.currency
    fin_data = [
        ["Metric", "Value"],
        ["Installation Cost", f"{currency} {analysis.installation_cost:,.0f}"],
        ["Annual Savings", f"{currency} {analysis.annual_savings:,.0f}"],
        ["Payback Period", f"{analysis.payback_years:.1f} years"],
        ["25-Year NPV", f"{currency} {analysis.npv_25yr:,.0f}"],
    ]
    fin_table = Table(fin_data, colWidths=[9*cm, 9*cm])
    fin_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), BLUE),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, black),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(fin_table)
    story.append(Spacer(1, 12))

    # Environmental Impact
    story.append(Paragraph("Environmental Impact", h2_style))
    env_data = [
        ["Metric", "Value"],
        ["CO2 Avoided (Annual)", f"{analysis.co2_annual_kg:,.0f} kg"],
        ["CO2 Avoided (25 Years)", f"{analysis.co2_annual_kg * 25 / 1000:,.1f} tonnes"],
        ["Equivalent Trees Planted", f"{analysis.trees_equivalent:,} trees/year"],
    ]
    env_table = Table(env_data, colWidths=[9*cm, 9*cm])
    env_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), GREEN),
        ("TEXTCOLOR", (0, 0), (-1, 0), DARK),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, black),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(env_table)
    story.append(Spacer(1, 12))

    # Monthly Generation Table
    story.append(Paragraph("Monthly Generation Estimate", h2_style))
    months = analysis.monthly_generation
    # 2-row display: Jan-Jun, Jul-Dec
    month_header = [m.month for m in months[:6]]
    month_vals   = [f"{m.kwh:,.0f}" for m in months[:6]]
    month_header2 = [m.month for m in months[6:]]
    month_vals2   = [f"{m.kwh:,.0f}" for m in months[6:]]

    col_w = [3*cm]*6
    for rows, header in [([month_header, month_vals], month_header),
                          ([month_header2, month_vals2], month_header2)]:
        t = Table(rows, colWidths=col_w)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), ORANGE),
            ("TEXTCOLOR", (0, 0), (-1, 0), white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("BACKGROUND", (0, 1), (-1, 1), LIGHT),
            ("GRID", (0, 0), (-1, -1), 0.5, SLATE),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(t)
        story.append(Spacer(1, 4))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Values in kWh/month", center_style))
    story.append(HRFlowable(width="100%", thickness=1, color=SLATE, spaceAfter=8))
    story.append(Paragraph("Disclaimer: This report is an estimate. Actual generation may vary based on local shading, panel brand, installation quality, and weather patterns. Consult a certified solar installer for final sizing.", body_style))
    story.append(Paragraph("Generated by SolarScope — Open Source Rooftop Solar Calculator", center_style))

    doc.build(story)
    return buffer.getvalue()
