import React from 'react';
import { createRoot } from 'react-dom/client';
import { BillDocumentImport } from '../../../src/components/bill-document-import';
import '../../../src/app/globals.css';
createRoot(document.getElementById('root')!).render(<div style={{ maxWidth: 480, padding: 16, margin: 'auto' }}><BillDocumentImport /></div>);
