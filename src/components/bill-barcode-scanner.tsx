'use client';

import { useEffect, useRef, useState } from 'react';
import type { IScannerControls } from '@zxing/browser';
import { makeBarcodeReader } from '@/lib/boleto-extractor';
import { parseBoletoCode } from '@/lib/boleto-code';

export function BillBarcodeScanner({ onCapture, onClose }: { onCapture: (file: File, code?: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const captureRef = useRef<(code?: string) => void>(() => {});
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let disposed = false;
    let captured = false;
    let stream: MediaStream | undefined;
    let controls: IScannerControls | undefined;
    const stop = () => { controls?.stop(); stream?.getTracks().forEach(track => track.stop()); };
    async function capture(code?: string) {
      const element = video.current;
      if (disposed || captured || !element?.videoWidth) return;
      captured = true; setCapturing(true);
      const canvas = document.createElement('canvas');
      canvas.width = element.videoWidth; canvas.height = element.videoHeight;
      canvas.getContext('2d')!.drawImage(element, 0, 0);
      canvas.toBlob(blob => {
        if (disposed) return;
        if (!blob) { captured = false; setCapturing(false); setError('Não foi possível capturar. Tente novamente.'); return; }
        stop(); onCapture(new File([blob], `boleto-${Date.now()}.jpg`, { type: 'image/jpeg' }), code);
      }, 'image/jpeg', 0.95);
    }
    captureRef.current = code => { void capture(code); };
    async function start() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Use HTTPS e um navegador com acesso à câmera, ou envie uma foto pelo botão Arquivo.');
        const reader = await makeBarcodeReader();
        if (disposed) return;
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
        if (disposed) { stop(); return; }
        controls = await reader.decodeFromStream(stream, video.current!, result => {
          if (!result || disposed || captured) return;
          try { parseBoletoCode(result.getText()); } catch { /* Keep scanning invalid codes. */ }
        });
        if (disposed) { stop(); return; }
        setReady(true);
      } catch (reason) {
        stop();
        if (!disposed) setError(reason instanceof DOMException && reason.name === 'NotAllowedError' ? 'Acesso à câmera negado. Autorize nas configurações do navegador ou envie uma foto em Arquivo.' : 'Não foi possível abrir a câmera. Tente novamente ou envie uma foto em Arquivo.');
      }
    }
    void start();
    return () => { disposed = true; stop(); };
  }, [onCapture]);

  return <section className="barcode-scanner" aria-label="Leitor de código de barras">
    <p role="status">{ready ? 'Enquadre o boleto inteiro e toque em Fotografar.' : 'Abrindo câmera…'}</p>
    <div className="scanner-view"><video ref={video} muted playsInline autoPlay /><div className="scanner-guide" aria-hidden="true"><span /></div></div>
    <p className="helper-text">A foto capturada será anexada. Para guardar o boleto inteiro, enquadre toda a folha ou envie o PDF.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button type="button" className="primary-action" disabled={!ready || capturing} onClick={() => captureRef.current()}>{capturing ? 'Capturando…' : 'Fotografar boleto'}</button>
    <button type="button" className="secondary-action" onClick={onClose}>Fechar câmera</button>
  </section>;
}
