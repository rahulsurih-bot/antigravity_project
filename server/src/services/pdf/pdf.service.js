import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateAdvisoryPdf(advisoryData, farmerProfile, farmDetails) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
  const { width, height } = page.getSize();

  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const forestGreen = rgb(0.12, 0.45, 0.25);
  const slateText = rgb(0.2, 0.25, 0.3);
  const amberWarning = rgb(0.85, 0.55, 0.1);
  const lineGray = rgb(0.85, 0.85, 0.85);

  let y = height - 50;

  // Header Title
  page.drawText('AgriSmart AI - Crop Advisory Report', {
    x: 50,
    y,
    size: 20,
    font: fontBold,
    color: forestGreen
  });

  y -= 25;
  page.drawText('Official Intelligent Agronomic Decision Support Dossier', {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: slateText
  });

  y -= 15;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1.5,
    color: forestGreen
  });

  y -= 30;

  // Metadata Section
  page.drawText(`Date: ${new Date(advisoryData.created_at || Date.now()).toLocaleDateString()}`, {
    x: 50,
    y,
    size: 10,
    font: fontBold,
    color: slateText
  });

  page.drawText(`Report ID: ${advisoryData.id || 'N/A'}`, {
    x: 300,
    y,
    size: 10,
    font: fontRegular,
    color: slateText
  });

  y -= 20;

  page.drawText(`Farmer Name: ${farmerProfile?.full_name || 'Registered Farmer'}`, {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: slateText
  });

  page.drawText(`Phone: ${farmerProfile?.phone || 'Not provided'}`, {
    x: 300,
    y,
    size: 10,
    font: fontRegular,
    color: slateText
  });

  y -= 20;

  page.drawText(`Farm: ${farmDetails?.farm_name || 'Main Farm'} (${farmDetails?.area || 1} ${farmDetails?.area_unit || 'acres'})`, {
    x: 50,
    y,
    size: 10,
    font: fontRegular,
    color: slateText
  });

  page.drawText(`Location: ${farmDetails?.village || farmDetails?.district || 'Karnataka'}, ${farmDetails?.state || 'India'}`, {
    x: 300,
    y,
    size: 10,
    font: fontRegular,
    color: slateText
  });

  y -= 25;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 0.5,
    color: lineGray
  });

  y -= 30;

  // Advisory Type Header
  const typeTitles = {
    crop_recommendation: 'Crop Suitability & Rotation Advisory',
    disease_detection: 'Plant Pathology & Pest Diagnostic Report',
    fertilizer: 'Nutrient Management & Fertilizer Advisory',
    irrigation: 'Water Management & Smart Irrigation Advisory',
    weather: 'Weather-Based Agricultural Risk Alert'
  };

  page.drawText(`ADVISORY TYPE: ${(typeTitles[advisoryData.advisory_type] || advisoryData.advisory_type).toUpperCase()}`, {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: forestGreen
  });

  y -= 25;

  const result = advisoryData.result_data || {};

  // Summary / Overview
  const summaryText = result.summary || result.weather_summary || (result.visual_observations && result.visual_observations[0]) || 'AI agronomic evaluation successfully completed.';
  page.drawText('Executive Summary:', { x: 50, y, size: 11, font: fontBold, color: slateText });
  y -= 18;

  // Split summary lines safely
  const splitText = summaryText.match(/.{1,75}(\s|$)/g) || [summaryText];
  for (const line of splitText.slice(0, 3)) {
    page.drawText(line.trim(), { x: 50, y, size: 9, font: fontRegular, color: slateText });
    y -= 14;
  }

  y -= 15;

  // Specific Findings
  if (advisoryData.advisory_type === 'crop_recommendation' && result.recommended_crops) {
    page.drawText('Top Recommended Crops:', { x: 50, y, size: 11, font: fontBold, color: forestGreen });
    y -= 18;
    for (const crop of result.recommended_crops.slice(0, 3)) {
      page.drawText(`• ${crop.crop_name} - Suitability: ${crop.suitability_score}% (${crop.suitability_category})`, {
        x: 60,
        y,
        size: 9,
        font: fontBold,
        color: slateText
      });
      y -= 14;
      if (crop.reasoning && crop.reasoning[0]) {
        const rLine = crop.reasoning[0].slice(0, 80);
        page.drawText(`  Rationale: ${rLine}`, { x: 70, y, size: 8, font: fontRegular, color: slateText });
        y -= 14;
      }
    }
  } else if (advisoryData.advisory_type === 'disease_detection' && result.possible_conditions) {
    page.drawText('Possible Plant Health Conditions:', { x: 50, y, size: 11, font: fontBold, color: forestGreen });
    y -= 18;
    for (const cond of result.possible_conditions.slice(0, 2)) {
      page.drawText(`• ${cond.condition_name} (${cond.condition_type}) - Confidence: ${cond.confidence}`, {
        x: 60,
        y,
        size: 9,
        font: fontBold,
        color: slateText
      });
      y -= 14;
    }
    if (result.recommended_actions) {
      y -= 10;
      page.drawText('Recommended Safe Immediate Actions:', { x: 50, y, size: 10, font: fontBold, color: slateText });
      y -= 16;
      for (const act of result.recommended_actions.slice(0, 3)) {
        page.drawText(`- ${act.slice(0, 80)}`, { x: 60, y, size: 8.5, font: fontRegular, color: slateText });
        y -= 14;
      }
    }
  } else if (advisoryData.advisory_type === 'fertilizer' && result.nutrient_assessment) {
    page.drawText('Nutrient Assessments:', { x: 50, y, size: 11, font: fontBold, color: forestGreen });
    y -= 18;
    for (const n of result.nutrient_assessment.slice(0, 3)) {
      page.drawText(`• ${n.nutrient}: ${n.status.toUpperCase()} - ${n.reason.slice(0, 60)}`, {
        x: 60,
        y,
        size: 9,
        font: fontRegular,
        color: slateText
      });
      y -= 14;
    }
  }

  y -= 25;

  // Important Warnings Section
  page.drawText('IMPORTANT AGRICULTURAL DISCLAIMER & WARNINGS:', {
    x: 50,
    y,
    size: 10,
    font: fontBold,
    color: amberWarning
  });
  y -= 16;

  const disclaimer = [
    '• AI predictions are advisory estimates and should be verified with local agricultural extension / KVK officers.',
    '• Do not mix synthetic pesticides without consulting product labels and certified agronomic experts.',
    '• Maintain regular laboratory soil testing once every 2-3 years for precise fertilizer budgeting.'
  ];

  for (const disc of disclaimer) {
    page.drawText(disc, { x: 50, y, size: 8, font: fontRegular, color: slateText });
    y -= 13;
  }

  // Footer
  page.drawLine({
    start: { x: 50, y: 50 },
    end: { x: width - 50, y: 50 },
    thickness: 0.5,
    color: lineGray
  });

  page.drawText('Generated by AgriSmart AI — Responsible Digital Agriculture for All Farmers', {
    x: 120,
    y: 35,
    size: 8,
    font: fontRegular,
    color: slateText
  });

  return await pdfDoc.save();
}
