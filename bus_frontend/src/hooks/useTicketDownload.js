import { useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Downloads the element pointed to by `ref` as a PDF file.
 * Uses html-to-image (not html2canvas) for full Tailwind v4 / oklch support.
 * @param {React.RefObject} ref - Ref attached to the ticket wrapper element.
 * @param {string} filename - The output filename (without extension).
 * @returns {{ downloadTicket, isDownloading }}
 */
export function useTicketDownload(ref, filename = 'bus-ticket') {
    const [isDownloading, setIsDownloading] = useState(false);

    const downloadTicket = useCallback(async () => {
        const element = ref?.current;
        if (!element) {
            console.error('Ticket element not found for PDF generation');
            return;
        }
        if (!element.isConnected) {
            console.error('Ticket element is not connected to the DOM');
            return;
        }

        setIsDownloading(true);
        try {
            // Wait for fonts and any pending renders
            if (document.fonts) await document.fonts.ready;
            await new Promise(resolve => setTimeout(resolve, 600));

            // html-to-image handles oklch, css variables, and modern CSS natively
            const dataUrl = await toPng(element, {
                quality: 1.0,
                pixelRatio: 2,          // 2x for high DPI / retina quality
                skipAutoScale: false,
                backgroundColor: '#050B14',
                style: {
                    // Ensure the element is rendered correctly
                    margin: '0',
                    borderRadius: '0',  // Rounded corners can cause edge clipping in some browsers
                }
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
                putOnlyUsedFonts: true,
            });

            const pdfW = pdf.internal.pageSize.getWidth();
            const pdfH = pdf.internal.pageSize.getHeight();

            // Create a temp image to get natural dimensions
            const img = new Image();
            img.src = dataUrl;
            await new Promise(resolve => { img.onload = resolve; });

            const padding = 10;
            const usableW = pdfW - padding * 2;
            const usableH = pdfH - padding * 2;

            const imgRatio = img.naturalWidth / img.naturalHeight;
            const pageRatio = usableW / usableH;

            let drawW, drawH;
            if (imgRatio > pageRatio) {
                drawW = usableW;
                drawH = usableW / imgRatio;
            } else {
                drawH = usableH;
                drawW = usableH * imgRatio;
            }

            const offsetX = (pdfW - drawW) / 2;
            const offsetY = (pdfH - drawH) / 2;

            pdf.addImage(dataUrl, 'PNG', offsetX, offsetY, drawW, drawH, undefined, 'FAST');
            pdf.save(`${filename}.pdf`);

        } catch (err) {
            console.error('PDF generation error:', err);
            alert('Failed to generate PDF. Please try using Ctrl+P → Save as PDF instead.');
        } finally {
            setIsDownloading(false);
        }
    }, [ref, filename]);

    return { downloadTicket, isDownloading };
}
