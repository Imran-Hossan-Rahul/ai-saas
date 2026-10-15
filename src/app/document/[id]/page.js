"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, ShieldCheck, PenTool, X } from "lucide-react";
import toast from "react-hot-toast";

export default function PublicDocumentPage() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [signerName, setSignerName] = useState("");
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const res = await fetch(`/api/public/documents/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDocument(data.document);
        } else {
          toast.error("Document not found or expired.");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  // Canvas drawing logic
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    
    if (clientX === undefined || clientY === undefined) return null;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    ctx.lineTo(coords.x, coords.y);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = async () => {
    if (!signerName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    const canvas = canvasRef.current;
    const signatureDataUrl = canvas.toDataURL("image/png");
    
    // Check if canvas is actually empty (simple check)
    const ctx = canvas.getContext("2d");
    const pixelBuffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const hasDrawn = pixelBuffer.some(color => color !== 0);
    if (!hasDrawn) {
      toast.error("Please draw your signature in the box.");
      return;
    }

    try {
      const res = await fetch(`/api/public/documents/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName, signatureDataUrl }),
      });

      if (res.ok) {
        toast.success("Document signed successfully!");
        setDocument(prev => ({ ...prev, status: "signed" }));
        setIsSigning(false);
      } else {
        toast.error("Failed to sign document.");
      }
    } catch (error) {
      toast.error("An error occurred.");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading document...</div>;
  }

  if (!document) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-rose-400">Document unavailable or link expired.</div>;
  }

  const isSigned = document.status === "signed";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Banner */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-2xl mx-auto flex items-center justify-center">
            {isSigned ? <CheckCircle2 className="text-emerald-500" size={32} /> : <ShieldCheck className="text-indigo-400" size={32} />}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{document.title}</h1>
          <p className="text-slate-400">
            {isSigned ? "This document has been legally signed and finalized." : "Please review the document below and provide your signature to accept."}
          </p>
        </div>

        {/* Document Content */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
          {/* Watermark if signed */}
          {isSigned && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-5 rotate-[-30deg]">
              <span className="text-9xl font-black uppercase">SIGNED</span>
            </div>
          )}
          
          <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap leading-relaxed">
            {document.content}
          </div>

          {document.amount > 0 && (
            <div className="mt-10 p-6 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
              <span className="font-semibold text-slate-400">Total Amount:</span>
              <span className="text-2xl font-bold text-emerald-400">${document.amount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Signature Action Area */}
        {!isSigned ? (
          <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
            
            {!isSigning ? (
              <div className="text-center space-y-6">
                <h3 className="text-xl font-bold text-white">Ready to proceed?</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">By signing this document, you agree to the terms and conditions outlined above. This action constitutes a legally binding agreement.</p>
                <button 
                  onClick={() => setIsSigning(true)}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-lg transition-all flex items-center mx-auto gap-2"
                >
                  <PenTool size={20} /> Sign Document
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Digital Signature</h3>
                  <button onClick={() => setIsSigning(false)} className="text-slate-500 hover:text-slate-300"><X size={20}/></button>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Your Full Legal Name</label>
                  <input 
                    type="text" 
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider">Draw Signature</label>
                    <button onClick={clearCanvas} className="text-xs text-indigo-400 hover:text-indigo-300">Clear</button>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden cursor-crosshair relative">
                    {/* Baseline */}
                    <div className="absolute bottom-1/4 left-4 right-4 h-[1px] bg-slate-800/50 pointer-events-none"></div>
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={200}
                      className="w-full h-48 touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                </div>

                <button 
                  onClick={submitSignature}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} /> Accept & Sign Document
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4">
            <h3 className="text-xl font-bold text-emerald-400">Document Signed</h3>
            <p className="text-slate-400 text-sm">A copy of this signed agreement has been saved to your workspace.</p>
            {document.signatures && document.signatures[0] && (
              <div className="mt-6 inline-block bg-slate-950 p-4 rounded-xl border border-slate-800">
                <img src={document.signatures[0].signatureDataUrl} alt="Signature" className="h-16 filter invert opacity-80" />
                <div className="text-xs text-slate-500 mt-2">
                  Signed by: {document.signatures[0].signerName} <br/>
                  Date: {new Date(document.signatures[0].signedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
