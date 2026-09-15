import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import heic2any from 'heic2any';
import { LAPTOP_MODELS, SPECS_OPTIONS } from '../utils/constants';
import './SerialScannerModal.css';

/**
 * Apple Serial Number & Device Info Scanner Component
 * Handles live camera capture / image upload, canvas cropping, 2.5x upscaling,
 * high-contrast thresholding, Tesseract OCR, and auto-detects Serial Number, Model, and Specs.
 */
const SerialScannerModal = ({ isOpen, onClose, onConfirm, initialValue = '' }) => {
    const [stream, setStream] = useState(null);
    const [cameraError, setCameraError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progressText, setProgressText] = useState('');
    const [capturedImage, setCapturedImage] = useState(null);
    const [scannedSerial, setScannedSerial] = useState(initialValue);
    const [scannedModel, setScannedModel] = useState('');
    const [scannedSpecs, setScannedSpecs] = useState('');
    const [isValidSerial, setIsValidSerial] = useState(true);
    const [scannerStep, setScannerStep] = useState('camera'); // 'camera' | 'confirm'

    const videoRef = useRef(null);
    const guideRef = useRef(null);
    const fileInputRef = useRef(null);

    // Clean serial string: uppercase, extract serial from full screen OCR text
    const cleanSerialText = (rawText) => {
        if (!rawText) return '';
        const text = rawText.toUpperCase();

        // 1. Try to extract 10-12 char serial number directly following "SERIAL NUMBER", "SERIAL NO", "SERIAL", "S/N", etc.
        const keywordMatch = text.match(/(?:SERIAL\s*NUMBER|SERIAL\s*NO|SERIAL|S\/?N)[\s:]*([A-Z0-9]{10,12})/i);
        if (keywordMatch && keywordMatch[1]) {
            return keywordMatch[1];
        }

        // 2. Look for any standalone 10, 11, or 12 character Apple serial word
        const standaloneMatch = text.match(/\b([A-Z0-9]{10,12})\b/);
        if (standaloneMatch && standaloneMatch[1]) {
            return standaloneMatch[1];
        }

        // 3. Fallback: Strip common menu labels and non-alphanumeric chars
        let stripped = text
            .replace(/^(SERIAL\s*NUMBER|SERIAL\s*NO|SERIAL|S\/N|SN)[\s:]*/gi, '')
            .replace(/(ABOUT|NAME|MODEL|NUMBER|VERSION|COVERAGE|EXPIRED|PARTS|SERVICE|HISTORY|SONGS|VIDEOS|PHOTOS|IPHONE|MACBOOK|PRO|AIR|SERIALNUMBER|MODELNUMBER|MODELNAME|OSVERSION)/g, '')
            .replace(/[^A-Z0-9]/gi, '');

        if (stripped.length >= 10) {
            return stripped.slice(0, 12);
        }

        return stripped;
    };

    // Detect Laptop Model from raw OCR text
    const detectModelFromText = (rawText) => {
        if (!rawText) return '';
        const upper = rawText.toUpperCase();

        // Direct match with LAPTOP_MODELS
        for (const model of LAPTOP_MODELS) {
            if (upper.includes(model.toUpperCase())) {
                return model;
            }
        }

        // Fuzzy detection based on Air/Pro, size, and M-chip family
        const isPro = upper.includes('PRO') || upper.includes('MACBOOKPRO');
        const isAir = upper.includes('AIR') || upper.includes('MACBOOKAIR');
        const family = isPro ? 'Pro' : (isAir ? 'Air' : '');

        let size = '';
        if (upper.includes('13"') || upper.includes('13-INCH') || upper.includes('13')) size = '13"';
        else if (upper.includes('14"') || upper.includes('14-INCH') || upper.includes('14')) size = '14"';
        else if (upper.includes('15"') || upper.includes('15-INCH') || upper.includes('15')) size = '15"';
        else if (upper.includes('16"') || upper.includes('16-INCH') || upper.includes('16')) size = '16"';

        let chip = '';
        if (upper.includes('M5')) chip = upper.includes('MAX') ? 'M5 Max' : (upper.includes('PRO') ? 'M5 Pro' : 'M5');
        else if (upper.includes('M4')) chip = upper.includes('MAX') ? 'M4 Max' : (upper.includes('PRO') ? 'M4 Pro' : 'M4');
        else if (upper.includes('M3')) chip = upper.includes('MAX') ? 'M3 Max' : (upper.includes('PRO') ? 'M3 Pro' : 'M3');
        else if (upper.includes('M2')) chip = upper.includes('MAX') ? 'M2 Max' : (upper.includes('PRO') ? 'M2 Pro' : 'M2');
        else if (upper.includes('M1')) chip = upper.includes('MAX') ? 'M1 Max' : (upper.includes('PRO') ? 'M1 Pro' : 'M1');

        if (family && size && chip) {
            const candidate = `MacBook ${family} ${size} ${chip}`;
            const matched = LAPTOP_MODELS.find(m => m.toLowerCase() === candidate.toLowerCase());
            if (matched) return matched;
        }

        return '';
    };

    // Detect Specs (RAM/Storage) from raw OCR text
    const detectSpecsFromText = (rawText, selectedModel) => {
        if (!rawText) return '';
        const upper = rawText.toUpperCase();

        const ramMatch = upper.match(/(8|16|18|24|32|36|48|64|96|128)\s*GB/i);
        const ram = ramMatch ? `${ramMatch[1]}GB` : '';

        const ssdMatch = upper.match(/(256|512)\s*GB|(1|2|4|8)\s*TB/i);
        let ssd = '';
        if (ssdMatch) {
            if (ssdMatch[1]) ssd = `${ssdMatch[1]}GB`;
            else if (ssdMatch[2]) ssd = `${ssdMatch[2]}TB`;
        }

        if (ram && ssd) {
            const specCandidate = `${ram}/${ssd}`;
            if (selectedModel && SPECS_OPTIONS[selectedModel]) {
                const found = SPECS_OPTIONS[selectedModel].find(s => s === specCandidate);
                if (found) return found;
            }
            return specCandidate;
        }

        return '';
    };

    // Validate Apple serial format (10, 11, or 12 alphanumeric chars)
    const validateAppleSerial = (serial) => {
        return /^[A-Z0-9]{10,12}$/.test(serial);
    };

    // Start Camera Stream
    const startCamera = async () => {
        setCameraError(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Prefer rear camera on mobile/tablets
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            let errMsg = "Unable to access camera.";
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errMsg = "Camera permission denied. Please allow camera access in your browser.";
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errMsg = "No camera device found.";
            } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                errMsg = "Camera access requires a secure HTTPS connection.";
            }
            setCameraError(errMsg);
        }
    };

    // Stop Camera Stream
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    useEffect(() => {
        if (isOpen && scannerStep === 'camera') {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, scannerStep]);

    // Perform cropping, upscaling, thresholding, and OCR
    const processImageSource = async (sourceCanvas, cropArea = null) => {
        setIsProcessing(true);
        setProgressText('Preparing image for OCR...');

        try {
            let cropCanvas = document.createElement('canvas');
            let cropCtx = cropCanvas.getContext('2d');

            let srcWidth = sourceCanvas.width;
            let srcHeight = sourceCanvas.height;

            let cropX = 0;
            let cropY = 0;
            let cropW = srcWidth;
            let cropH = srcHeight;

            if (cropArea) {
                cropX = Math.max(0, cropArea.x);
                cropY = Math.max(0, cropArea.y);
                cropW = Math.min(srcWidth - cropX, cropArea.w);
                cropH = Math.min(srcHeight - cropY, cropArea.h);
            }

            // Calculate optimal scaling: upscale small guide crops (<1200px), keep high-res uploads at normal scale (max 1920px width)
            let upscaleFactor = 1.0;
            if (cropW < 1200) {
                upscaleFactor = Math.min(2.5, 1920 / cropW);
            }

            const targetW = Math.max(100, Math.round(cropW * upscaleFactor));
            const targetH = Math.max(100, Math.round(cropH * upscaleFactor));

            cropCanvas.width = targetW;
            cropCanvas.height = targetH;

            cropCtx.imageSmoothingEnabled = true;
            cropCtx.imageSmoothingQuality = 'high';
            cropCtx.drawImage(sourceCanvas, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

            // High-contrast binarization thresholding
            const imgData = cropCtx.getImageData(0, 0, targetW, targetH);
            const data = imgData.data;

            let totalLuminance = 0;
            for (let i = 0; i < data.length; i += 4) {
                const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                totalLuminance += lum;
            }
            const avgLum = totalLuminance / (data.length / 4);
            const threshold = Math.max(100, Math.min(170, avgLum * 0.95));

            for (let i = 0; i < data.length; i += 4) {
                const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                const bw = lum < threshold ? 0 : 255;
                data[i] = bw;
                data[i + 1] = bw;
                data[i + 2] = bw;
            }
            cropCtx.putImageData(imgData, 0, 0);

            const previewUrl = cropCanvas.toDataURL('image/png');
            setCapturedImage(previewUrl);

            // Run Tesseract OCR with extended character whitelist for Model & Specs
            setProgressText('Recognizing Serial Number & Info...');
            const result = await Tesseract.recognize(
                cropCanvas,
                'eng',
                {
                    tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 :"/-,.',
                }
            );

            const rawText = result.data.text || '';
            console.log('OCR Raw Output:', rawText);

            // Clean and extract fields
            const cleanedSerial = cleanSerialText(rawText);
            const detectedModel = detectModelFromText(rawText);
            const detectedSpecs = detectSpecsFromText(rawText, detectedModel);

            setScannedSerial(cleanedSerial);
            setScannedModel(detectedModel);
            setScannedSpecs(detectedSpecs);
            setIsValidSerial(validateAppleSerial(cleanedSerial));

            stopCamera();
            setScannerStep('confirm');
        } catch (err) {
            console.error('OCR processing error:', err);
            alert('Failed to process image for OCR. Please try again.');
        } finally {
            setIsProcessing(false);
            setProgressText('');
        }
    };

    // Capture current frame from live camera
    const handleCapture = () => {
        if (!videoRef.current || !guideRef.current) return;

        const video = videoRef.current;
        const guide = guideRef.current;

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        if (!videoWidth || !videoHeight) {
            alert('Camera stream is not ready yet.');
            return;
        }

        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = videoWidth;
        frameCanvas.height = videoHeight;
        const ctx = frameCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

        const videoRect = video.getBoundingClientRect();
        const guideRect = guide.getBoundingClientRect();

        const scaleX = videoWidth / videoRect.width;
        const scaleY = videoHeight / videoRect.height;

        const cropX = (guideRect.left - videoRect.left) * scaleX;
        const cropY = (guideRect.top - videoRect.top) * scaleY;
        const cropW = guideRect.width * scaleX;
        const cropH = guideRect.height * scaleY;

        processImageSource(frameCanvas, { x: cropX, y: cropY, w: cropW, h: cropH });
    };

    // Handle File Upload Fallback (including HEIC / HEIF photos from iPhones)
    const handleFileUpload = async (e) => {
        let file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setProgressText('Processing image...');

        try {
            const fileName = file.name.toLowerCase();
            const fileType = file.type.toLowerCase();
            const isHeic = fileName.endsWith('.heic') || fileName.endsWith('.heif') || fileType.includes('heic') || fileType.includes('heif');

            if (isHeic) {
                setProgressText('Converting iPhone HEIC image...');
                const convertedResult = await heic2any({
                    blob: file,
                    toType: 'image/jpeg',
                    quality: 0.85
                });
                const resultBlob = Array.isArray(convertedResult) ? convertedResult[0] : convertedResult;
                file = new File([resultBlob], 'photo.jpg', { type: 'image/jpeg' });
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    processImageSource(canvas);
                };
                img.onerror = () => {
                    alert('Unable to load image. Please select a valid JPEG, PNG, or screenshot.');
                    setIsProcessing(false);
                    setProgressText('');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('HEIC conversion/reading error:', err);
            alert('Could not process HEIC photo. Please select a JPEG, PNG, or screenshot.');
            setIsProcessing(false);
            setProgressText('');
        } finally {
            e.target.value = '';
        }
    };

    // Handle Confirmation
    const handleConfirm = () => {
        const finalSerial = scannedSerial.trim().toUpperCase();
        if (!finalSerial) {
            alert('Please enter or scan a valid Serial Number.');
            return;
        }
        onConfirm({
            serialNumber: finalSerial,
            laptopModel: scannedModel,
            specs: scannedSpecs
        });
        handleClose();
    };

    const handleClose = () => {
        stopCamera();
        setScannerStep('camera');
        setCapturedImage(null);
        setScannedSerial('');
        setScannedModel('');
        setScannedSpecs('');
        onClose();
    };

    const handleRescan = () => {
        setScannerStep('camera');
        setCapturedImage(null);
        setScannedSerial('');
        setScannedModel('');
        setScannedSpecs('');
    };

    if (!isOpen) return null;

    const availableSpecs = scannedModel ? (SPECS_OPTIONS[scannedModel] || []) : [];

    return (
        <div className="serial-scanner-overlay" onClick={handleClose}>
            <div className="serial-scanner-modal" onClick={(e) => e.stopPropagation()}>
                <div className="serial-scanner-header">
                    <div className="header-title">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                        </svg>
                        <h3>Apple Device Scanner (Camera & OCR)</h3>
                    </div>
                    <button className="btn-scanner-close" onClick={handleClose} title="Close scanner">×</button>
                </div>

                <div className="serial-scanner-body">
                    {scannerStep === 'camera' && (
                        <div className="camera-view-container">
                            {cameraError ? (
                                <div className="camera-error-box">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="8" x2="12" y2="12"/>
                                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                    <p className="error-message">{cameraError}</p>
                                    <button 
                                        type="button" 
                                        className="btn-secondary"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        Upload Screenshot/Photo
                                    </button>
                                </div>
                            ) : (
                                <div className="video-wrapper">
                                    <video 
                                        ref={videoRef} 
                                        autoPlay 
                                        playsInline 
                                        muted 
                                        className="scanner-video"
                                    />
                                    <div className="scanner-guide-overlay" ref={guideRef}>
                                        <div className="guide-corner top-left"></div>
                                        <div className="guide-corner top-right"></div>
                                        <div className="guide-corner bottom-left"></div>
                                        <div className="guide-corner bottom-right"></div>
                                        <span className="guide-label">Align "Serial Number" & Device Details</span>
                                    </div>
                                </div>
                            )}

                            {isProcessing && (
                                <div className="processing-overlay">
                                    <div className="spinner"></div>
                                    <p>{progressText}</p>
                                </div>
                            )}

                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                accept="image/*,.heic,.heif" 
                                style={{ display: 'none' }}
                                onClick={(e) => { e.target.value = null; }}
                                onChange={handleFileUpload}
                            />

                            <div className="scanner-actions-bar">
                                <button 
                                    type="button" 
                                    className="btn-scanner-upload"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isProcessing}
                                    title="Upload screenshot or photo"
                                >
                                    📁 Upload Screenshot / Photo
                                </button>

                                {!cameraError && (
                                    <button 
                                        type="button" 
                                        className="btn-scanner-capture"
                                        onClick={handleCapture}
                                        disabled={isProcessing}
                                    >
                                        <span className="capture-icon">●</span> Capture & Scan
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {scannerStep === 'confirm' && (
                        <div className="confirm-view-container">
                            <h4>Review Extracted Invoice Information</h4>

                            {capturedImage && (
                                <div className="captured-preview">
                                    <label className="preview-label">Processed Image Region:</label>
                                    <div className="preview-image-box">
                                        <img src={capturedImage} alt="OCR region preview" />
                                    </div>
                                </div>
                            )}

                            <div className="form-group serial-input-group">
                                <label htmlFor="scannedSerialInput">Detected Serial Number *</label>
                                <input 
                                    id="scannedSerialInput"
                                    type="text" 
                                    value={scannedSerial}
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setScannedSerial(val);
                                        setIsValidSerial(validateAppleSerial(val));
                                    }}
                                    placeholder="Enter or verify serial number"
                                    className={`scanned-input ${!isValidSerial ? 'invalid-border' : 'valid-border'}`}
                                    autoFocus
                                />
                                {!isValidSerial && (
                                    <div className="warning-badge">
                                        ⚠️ Apple Serial Numbers are typically 10 to 12 characters. Double check common OCR mix-ups (e.g. 0 vs O, 1 vs I).
                                    </div>
                                )}
                                {isValidSerial && scannedSerial && (
                                    <div className="success-badge">
                                        ✓ Valid Apple serial format ({scannedSerial.length} characters)
                                    </div>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Detected Laptop Model</label>
                                    <select
                                        value={scannedModel}
                                        onChange={(e) => setScannedModel(e.target.value)}
                                    >
                                        <option value="">Select or auto-detected model</option>
                                        {LAPTOP_MODELS.map(model => (
                                            <option key={model} value={model}>{model}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Detected Specs</label>
                                    <select
                                        value={scannedSpecs}
                                        onChange={(e) => setScannedSpecs(e.target.value)}
                                        disabled={!scannedModel}
                                    >
                                        <option value="">Select or auto-detected specs</option>
                                        {availableSpecs.map(spec => (
                                            <option key={spec} value={spec}>{spec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="confirm-actions-bar">
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={handleRescan}
                                >
                                    Rescan
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-primary btn-save-serial"
                                    onClick={handleConfirm}
                                >
                                    Insert Details into Invoice
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SerialScannerModal;
