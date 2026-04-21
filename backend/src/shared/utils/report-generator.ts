import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Parser } from 'json2csv';
import { HttpStatus } from '@nestjs/common';
import { AppError } from '@common/errors/app-error';
import { FactoryService } from '@shared/services/factory.service';

// Using any for flexible model, condition, and fields to work with any Mongoose model
interface DownloadReportOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  condition: any;
  format: 'csv' | 'pdf';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: any[];
  heading?: string;
}

const factoryService = new FactoryService();

export async function downloadReport(options: DownloadReportOptions): Promise<Buffer | string> {
  const { model, condition, format, fields, heading = 'Report' } = options;

  try {
    const foundTx = await factoryService.findMany(model, condition);
    const json2csvParser = new Parser({ fields });
    const csvContent = json2csvParser.parse(foundTx);

    if (format === 'pdf') {
      return await convertCsvToPdf(csvContent, heading);
    }

    return csvContent;
  } catch (error) {
    throw new AppError(
      `Error generating report: ${error.message}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export async function convertCsvToPdf(
  csvContent: string,
  heading: string = 'Report',
): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.create();
    const pageSize: [number, number] = [841.89, 595.28];
    const fontSize = 12;
    const headingFontSize = 18;
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const createNewPage = () => {
      const page = pdfDoc.addPage(pageSize);
      const { height } = page.getSize();
      page.drawText(heading, {
        x: 10,
        y: height - headingFontSize - 10,
        size: headingFontSize,
        font: boldFont,
      });
      return page;
    };

    let page = createNewPage();
    const { height } = page.getSize();

    const lines = csvContent.split('\n');
    const cellPadding = 5;
    const cellHeight = fontSize + cellPadding * 2;
    let yPosition = height - cellHeight - headingFontSize - 20;

    const table = lines.map((line) => line.split(','));

    const colWidths: number[] = [];
    table[0].forEach((_: string, colIndex: number) => {
      const maxColWidth = Math.max(...table.map((row) => row[colIndex].length));
      colWidths.push(maxColWidth * fontSize * 0.6 + cellPadding * 2);
    });

    for (const row of table) {
      if (yPosition < cellHeight) {
        page = createNewPage();
        yPosition = height - cellHeight - headingFontSize - 20;
      }

      let xPosition = 10;
      row.forEach((cell, colIndex) => {
        const cellWidth = colWidths[colIndex];

        page.drawRectangle({
          x: xPosition,
          y: yPosition,
          width: cellWidth,
          height: cellHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        page.drawText(cell, {
          x: xPosition + cellPadding,
          y: yPosition + cellPadding,
          size: fontSize,
          font: font,
        });

        xPosition += cellWidth;
      });
      yPosition -= cellHeight;
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    throw new AppError(`Error generating PDF: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
