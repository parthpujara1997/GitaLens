import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { socialService } from '../services/socialService';
import { X, Download, Loader2, Check, Link as LinkIcon, Share2 } from 'lucide-react';
import { GitaVerse } from '../types';

interface ShareModalProps {
    verse: GitaVerse;
    onClose: () => void;
    customReflection?: string;
}

// Simple SVG icons for social platforms (Lucide doesn't have all brand icons)
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
);

const PinterestIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z" />
    </svg>
);




const ShareModal: React.FC<ShareModalProps> = ({ verse, onClose, customReflection }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [downloadComplete, setDownloadComplete] = useState(false);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    const [canShareNative, setCanShareNative] = useState(false);

    // Phase 2 State
    const [isUploading, setIsUploading] = useState(false);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);


    // Pre-generate image on modal open for faster sharing
    useEffect(() => {
        generateImage();
        if (typeof navigator !== 'undefined' && navigator.share) {
            setCanShareNative(true);
        }
    }, []);

    const generateImage = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            // Small delay to ensure fonts/images are loaded
            await new Promise(resolve => setTimeout(resolve, 300));

            const canvas = await html2canvas(cardRef.current, {
                backgroundColor: '#F5F5F0',
                scale: 3, // Boost resolution even higher
                logging: false,
                useCORS: true,
                allowTaint: true,
                scrollX: 0,
                scrollY: -window.scrollY, // Avoid parallax/scroll offsets
            });
            setGeneratedImageUrl(canvas.toDataURL('image/png'));
        } catch (err) {
            console.error("Image generation failed", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const dataURLtoFile = (dataurl: string, filename: string) => {
        const arr = dataurl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleNativeShare = async () => {
        if (!generatedImageUrl) return;

        const file = dataURLtoFile(generatedImageUrl, `gitalens-${verse.reference.replace(/\s+/g, '-').toLowerCase()}.png`);

        if (navigator.share) {
            try {
                await navigator.share({
                    files: [file],
                    title: 'GitaLens Verse',
                    text: `"${verse.text}"\n\n— Bhagavad Gita ${verse.reference}\n\n✨ Shared from GitaLens`,
                });
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing', error);
                }
            }
        }
    };

    const handleCreateLink = async () => {
        if (!generatedImageUrl) return;
        setIsUploading(true);
        try {
            const file = dataURLtoFile(generatedImageUrl, `gita-${verse.id}.png`);
            const result = await socialService.createShareLink(verse.id, file);

            if (result) {
                // For now, we just give the public image URL. 
                // In a full implementation, this would be a landing page URL (Phase 3).
                // But Phase 2 goal: "Supabase-backed link sharing".
                // Let's use the image URL for now as it unfurls on some platforms, 
                // or just to prove the upload works.
                // const link = result.image_url;
                // Use a deep link to the app instead of raw image
                const link = `${window.location.origin}?vid=${verse.id}`;
                setShareLink(link);
                navigator.clipboard.writeText(link);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 3000);
            }
        } catch (err) {
            console.error('Link creation failed', err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadImage = () => {
        if (!generatedImageUrl) return;

        const link = document.createElement('a');
        link.download = `gitalens-${verse.reference.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.href = generatedImageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloadComplete(true);
        setTimeout(() => setDownloadComplete(false), 2000);
    };

    // Social sharing handlers
    // NOTE: Direct image sharing to these platforms is NOT possible from web browsers.
    // The best UX is: Download image, then open the platform's create/share page.

    const handleShareWhatsApp = () => {
        if (canShareNative) {
            handleNativeShare();
            return;
        }
        handleDownloadImage(); // Download image first
        // WhatsApp Web doesn't support image attachments via URL, text only
        const text = encodeURIComponent(`"${verse.text}"\n\n— Bhagavad Gita ${verse.reference}\n\n✨ Shared from GitaLens`);
        window.open(`https://web.whatsapp.com/send?text=${text}`, '_blank');
    };

    const handleShareInstagram = () => {
        if (canShareNative) {
            handleNativeShare();
            return;
        }
        handleDownloadImage(); // Download image first
        // Instagram has no web share API, redirect to feed
        window.open('https://www.instagram.com/', '_blank');
    };

    const handleShareFacebook = () => {
        if (canShareNative) {
            handleNativeShare();
            return;
        }
        handleDownloadImage(); // Download image first
        // Facebook share dialog (text only, user uploads image)
        window.open('https://www.facebook.com/', '_blank');
    };

    const handleShareX = () => {
        if (canShareNative) {
            handleNativeShare();
            return;
        }
        handleDownloadImage(); // Download image first
        const text = encodeURIComponent(`"${verse.text}"\n\n— Bhagavad Gita ${verse.reference}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    };

    const handleSharePinterest = () => {
        if (canShareNative) {
            handleNativeShare();
            return;
        }
        handleDownloadImage(); // Download image first
        // Pinterest allows image URL sharing, but not local files
        window.open('https://www.pinterest.com/pin-builder/', '_blank');
    };

    const socialButtons = [
        { name: 'WhatsApp', icon: WhatsAppIcon, handler: handleShareWhatsApp, color: 'bg-green-500 hover:bg-green-600' },
        { name: 'Instagram', icon: InstagramIcon, handler: handleShareInstagram, color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90' },
        { name: 'Facebook', icon: FacebookIcon, handler: handleShareFacebook, color: 'bg-blue-600 hover:bg-blue-700' },
        { name: 'X', icon: XIcon, handler: handleShareX, color: 'bg-black hover:bg-gray-800' },
        { name: 'Pinterest', icon: PinterestIcon, handler: handleSharePinterest, color: 'bg-red-600 hover:bg-red-700' },
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b border-stone-100 flex justify-between items-center shrink-0">
                    <h3 className="font-serif text-charcoal text-xl font-semibold">Share this design</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-stone-100 rounded-full text-stone-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Hidden Capture Area - Fixed off-screen to avoid cropping/clipping issues */}
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: '-9999px',
                        zIndex: -1,
                        pointerEvents: 'none'
                    }}
                >
                    <div
                        ref={cardRef}
                        style={{
                            width: '600px',
                            backgroundColor: '#F5F5F0',
                            padding: '48px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            border: '12px solid white', // Thick border for premium feel
                            boxSizing: 'border-box',
                        }}
                    >
                        <img
                            src="/logo.png"
                            alt="GitaLens"
                            crossOrigin="anonymous"
                            style={{ height: '70px', width: 'auto', marginBottom: '32px', opacity: 0.9 }}
                        />

                        <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#C2A15F', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>
                            {verse.reference}
                        </h4>
                        <span style={{ fontSize: '12px', color: '#78716c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '32px' }}>
                            {verse.speaker}
                        </span>

                        <p style={{ fontFamily: 'Georgia, serif', fontSize: '32px', fontStyle: 'italic', color: '#1c1917', lineHeight: 1.5, marginBottom: '32px', padding: '0 24px' }}>
                            "{verse.text}"
                        </p>

                        <div style={{ width: '60px', height: '2px', backgroundColor: '#C2A15F', marginBottom: '32px', opacity: 0.6 }} />

                        <p style={{ fontSize: '15px', color: '#57534e', lineHeight: 1.8, maxWidth: '500px', fontStyle: 'italic', paddingBottom: '20px' }}>
                            {customReflection || verse.reflection || ""}
                        </p>
                    </div>
                </div>

                {/* Image Preview */}
                <div className="p-6 bg-stone-50 flex items-center justify-center overflow-y-auto flex-1 min-h-0">
                    {isGenerating ? (
                        <div className="w-full aspect-[4/5] max-w-[280px] bg-stone-200 rounded-xl animate-pulse flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-stone-400 animate-spin" />
                        </div>
                    ) : generatedImageUrl ? (
                        <img
                            src={generatedImageUrl}
                            alt="Preview"
                            className="w-full max-w-[280px] rounded-xl shadow-lg border border-stone-200"
                        />
                    ) : (
                        <div className="w-full aspect-[4/5] max-w-[280px] bg-stone-200 rounded-xl flex items-center justify-center">
                            <span className="text-stone-400 text-sm">Generating preview...</span>
                        </div>
                    )}
                </div>

                {/* Social Icons */}
                <div className="px-6 py-5 border-t border-stone-100">
                    {/* Native Share Button (Mobile) */}
                    {canShareNative && (
                        <button
                            onClick={handleNativeShare}
                            disabled={!generatedImageUrl}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-xl py-3.5 font-medium hover:from-orange-500 hover:to-amber-600 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-4 shadow-lg text-lg"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.287 1.093s-.107.769-.287 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                            </svg>
                            <span>Share Image</span>
                        </button>
                    )}

                    <div className="flex justify-center items-center gap-4 mb-5">
                        {socialButtons.map((btn) => (
                            <button
                                key={btn.name}
                                onClick={btn.handler}
                                disabled={!generatedImageUrl}
                                className={`w-11 h-11 rounded-full ${btn.color} text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md`}
                                title={`Share to ${btn.name}`}
                            >
                                <btn.icon />
                            </button>
                        ))}
                    </div>

                    {/* Get Link Button (Phase 2) */}
                    <button
                        onClick={handleCreateLink}
                        disabled={!generatedImageUrl || isUploading}
                        className={`w-full flex items-center justify-center gap-2 mb-3 ${linkCopied ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'} rounded-xl py-3.5 font-medium transition-all active:scale-[0.98] disabled:opacity-50`}
                    >
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : linkCopied ? (
                            <>
                                <Check size={20} />
                                <span>Link Copied!</span>
                            </>
                        ) : (
                            <>
                                <LinkIcon size={20} />
                                <span>{shareLink ? 'Copy Link Again' : 'Get Public Link'}</span>
                            </>
                        )}
                    </button>

                    {/* Download Button */}
                    <button
                        onClick={handleDownloadImage}
                        disabled={!generatedImageUrl}
                        className={`w-full flex items-center justify-center gap-2 ${canShareNative ? 'bg-stone-50 text-stone-400 hover:bg-stone-100' : 'bg-charcoal text-white hover:bg-black'} rounded-xl py-3.5 font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {downloadComplete ? (
                            <>
                                <Check size={20} />
                                <span>Downloaded!</span>
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                <span>{canShareNative ? 'Save to Device' : 'Download Image'}</span>
                            </>
                        )}
                    </button>

                    {!canShareNative && (
                        <p className="text-center text-xs text-stone-400 mt-4 leading-relaxed">
                            Tip: Download the image first, then upload it<br />to your favorite social platform.
                        </p>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ShareModal;
