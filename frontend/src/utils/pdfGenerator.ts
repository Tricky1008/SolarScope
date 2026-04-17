import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SolarAnalysis } from '../types';

const ORANGE = '#F97316';
const BLUE = '#38BDF8';
const GREEN = '#4ADE80';
const DARK = '#0F172A';
const SLATE = '#334155';
const LIGHT = '#F1F5F9';

const fmt = (n: number, d = 0) => n.toLocaleString('en-IN', { maximumFractionDigits: d });

export function generatePdfClientSide(analysis: SolarAnalysis): void {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = 20;

    // ── Header ──
    doc.setFontSize(28);
    doc.setTextColor(ORANGE);
    doc.text('SolarScope', margin, y);
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(SLATE);
    doc.text('Rooftop Solar Potential Report', margin, y);
    y += 7;

    doc.setFontSize(9);
    doc.setTextColor('#64748B');
    const now = new Date();
    doc.text(`Generated: ${now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, margin, y);
    y += 5;

    if (analysis.address) {
        doc.text(`Location: ${analysis.address}`, margin, y);
        y += 5;
    }
    doc.text(`Coordinates: ${analysis.lat.toFixed(5)}°, ${analysis.lon.toFixed(5)}°`, margin, y);
    y += 3;

    // Orange divider
    doc.setDrawColor(ORANGE);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // ── Solar Score ──
    doc.setFontSize(13);
    doc.setTextColor(BLUE);
    doc.text('Solar Suitability Score', margin, y);
    y += 3;

    const score = analysis.solar_score;
    const rating = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Poor';
    const rec = score >= 80 ? 'Highly recommended for solar installation'
        : score >= 60 ? 'Recommended for solar installation'
            : score >= 40 ? 'Consider carefully before installing'
                : 'Not recommended for solar installation';

    autoTable(doc, {
        startY: y,
        head: [['Score', 'Rating', 'Recommendation']],
        body: [[`${score}/100`, rating, rec]],
        headStyles: { fillColor: ORANGE, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10, textColor: SLATE },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: margin, right: margin },
        styles: { lineColor: [0, 0, 0], lineWidth: 0.2 },
        theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // ── System Specifications ──
    doc.setFontSize(13);
    doc.setTextColor(BLUE);
    doc.text('System Specifications', margin, y);
    y += 3;

    const roofArea = analysis.roof_area_m2 ?? (analysis as any).total_roof_area_m2 ?? 0;

    const specRows: string[][] = [
        ['Total Roof Area', `${roofArea.toFixed(1)} m²`],
        ['Usable Roof Area', `${analysis.usable_area_m2.toFixed(1)} m²`],
        ['Number of Panels', `${analysis.num_panels} panels`],
        ['System Capacity', `${analysis.system_capacity_kwp.toFixed(2)} kWp`],
        ['Annual Generation', `${fmt(analysis.annual_generation_kwh)} kWh/year`],
    ];

    if (analysis.irradiance) {
        specRows.push(['Solar Irradiance (GHI)', `${analysis.irradiance.ghi.toFixed(2)} kWh/m²/day`]);
        specRows.push(['PVOUT', `${fmt(analysis.irradiance.pvout)} kWh/kWp/year`]);
    }

    if (analysis.prediction_source === 'model_image') {
        if (analysis.roof_orientation) specRows.push(['Roof Orientation', analysis.roof_orientation]);
        if (analysis.roof_tilt_degrees != null) specRows.push(['Estimated Tilt', `${analysis.roof_tilt_degrees.toFixed(1)}°`]);
        if (analysis.shading_factor != null) specRows.push(['Shading Factor', `${(analysis.shading_factor * 100).toFixed(0)}%`]);
        if (analysis.model_confidence != null) specRows.push(['Detection Confidence', `${(analysis.model_confidence * 100).toFixed(1)}%`]);
    }

    autoTable(doc, {
        startY: y,
        head: [['Parameter', 'Value']],
        body: specRows,
        headStyles: { fillColor: DARK, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10, textColor: SLATE },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: margin, right: margin },
        styles: { lineColor: [0, 0, 0], lineWidth: 0.2 },
        theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Financial Analysis ──
    doc.setFontSize(13);
    doc.setTextColor(BLUE);
    doc.text('Financial Analysis', margin, y);
    y += 3;

    const currency = analysis.currency || 'INR';
    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
            ['Installation Cost', `${currency} ${fmt(analysis.installation_cost)}`],
            ['Annual Savings', `${currency} ${fmt(analysis.annual_savings)}`],
            ['Payback Period', `${analysis.payback_years.toFixed(1)} years`],
            ['25-Year NPV', `${currency} ${fmt(analysis.npv_25yr)}`],
        ],
        headStyles: { fillColor: BLUE, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10, textColor: SLATE },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: margin, right: margin },
        styles: { lineColor: [0, 0, 0], lineWidth: 0.2 },
        theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // ── Environmental Impact ──
    doc.setFontSize(13);
    doc.setTextColor(BLUE);
    doc.text('Environmental Impact', margin, y);
    y += 3;

    autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
            ['CO2 Avoided (Annual)', `${fmt(analysis.co2_annual_kg)} kg`],
            ['CO2 Avoided (25 Years)', `${(analysis.co2_annual_kg * 25 / 1000).toFixed(1)} tonnes`],
            ['Equivalent Trees Planted', `${fmt(analysis.trees_equivalent)} trees/year`],
        ],
        headStyles: { fillColor: GREEN, textColor: DARK, fontStyle: 'bold', fontSize: 10 },
        bodyStyles: { fontSize: 10, textColor: SLATE },
        alternateRowStyles: { fillColor: LIGHT },
        margin: { left: margin, right: margin },
        styles: { lineColor: [0, 0, 0], lineWidth: 0.2 },
        theme: 'grid',
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    // Check if we need a new page for monthly generation
    if (y > 220) {
        doc.addPage();
        y = 20;
    }

    // ── Monthly Generation ──
    doc.setFontSize(13);
    doc.setTextColor(BLUE);
    doc.text('Monthly Generation Estimate', margin, y);
    y += 3;

    if (analysis.monthly_generation && analysis.monthly_generation.length > 0) {
        // First 6 months
        const months1 = analysis.monthly_generation.slice(0, 6);
        autoTable(doc, {
            startY: y,
            head: [months1.map(m => m.month)],
            body: [months1.map(m => `${fmt(m.kwh)}`)],
            headStyles: { fillColor: ORANGE, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9, halign: 'center' },
            bodyStyles: { fontSize: 9, textColor: SLATE, halign: 'center' },
            margin: { left: margin, right: margin },
            styles: { lineColor: [0, 0, 0], lineWidth: 0.2 },
            theme: 'grid',
        });
        y = (doc as any).lastAutoTable.finalY + 2;

        // Last 6 months
        const months2 = analysis.monthly_generation.slice(6);
        if (months2.length > 0) {
            autoTable(doc, {
                startY: y,
                head: [months2.map(m => m.month)],
                body: [months2.map(m => `${fmt(m.kwh)}`)],
                headStyles: { fillColor: ORANGE, textColor: '#FFFFFF', fontStyle: 'bold', fontSize: 9, halign: 'center' },
                bodyStyles: { fontSize: 9, textColor: SLATE, halign: 'center' },
                margin: { left: margin, right: margin },
                styles: { lineColor: [0, 0, 0], lineWidth: 0.2 },
                theme: 'grid',
            });
            y = (doc as any).lastAutoTable.finalY + 3;
        }

        doc.setFontSize(8);
        doc.setTextColor('#64748B');
        doc.text('Values in kWh/month', pageWidth / 2, y, { align: 'center' });
        y += 8;
    }

    // ── Footer ──
    doc.setDrawColor(SLATE);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;

    doc.setFontSize(7);
    doc.setTextColor('#94A3B8');
    doc.text(
        'Disclaimer: This report is an estimate. Actual generation may vary based on local shading, panel brand, installation quality, and weather patterns.',
        margin, y, { maxWidth: pageWidth - margin * 2 }
    );
    y += 8;
    doc.text('Generated by SolarScope — Open Source Rooftop Solar Calculator', pageWidth / 2, y, { align: 'center' });

    // ── Save ──
    const safeId = analysis.id ? analysis.id.slice(0, 8) : 'export';
    doc.save(`solarscope-report-${safeId}.pdf`);
}
