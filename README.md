# Teacher Timetable Manager

A browser-based teacher timetable manager with layout-aware timetable import.

## Smart Import

The app can import timetable data from:

- images and screenshots (Tesseract.js OCR)
- PDFs (PDF.js, preserving text positions)
- Word `.docx` files (Mammoth)
- Excel `.xlsx` / `.xls` and CSV files (SheetJS)
- plain text or pasted timetable text

Imported lessons are staged in an editable review table before they are added. The parser looks for weekday columns, lesson times/periods, subject names, class/group codes and room/lab labels. Duplicate lessons are skipped.

## Deployment

This repository is ready for a static Netlify deployment. Publish the repository root; `index.html` is the entry point.

## Privacy

Timetable data is stored in the browser using `localStorage`. Uploaded files are processed in the browser and are not sent to an application server by this app. OCR/PDF/document libraries are loaded from public CDNs.
