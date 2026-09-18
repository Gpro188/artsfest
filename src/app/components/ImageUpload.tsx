"use client";

import { useState } from "react";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  label?: string;
  initialUrl?: string | null;
}

export default function ImageUpload({ onUploadComplete, folder = "general", label = "Upload Image", initialUrl }: ImageUploadProps) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(initialUrl || null);

  const compressImage = (file: File, maxWidth = 1200, quality = 0.82): Promise<File | Blob> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(file);
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob && blob.size < file.size) {
                resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }));
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            quality
          );
        };
        img.onerror = () => resolve(file);
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const originalFile = e.target.files?.[0];
    if (!originalFile) return;

    // Support up to 5MB
    if (originalFile.size > 5 * 1024 * 1024) {
      setError("File is too large. Max allowed size is 5MB.");
      return;
    }

    // Set immediate preview
    const objectUrl = URL.createObjectURL(originalFile);
    setPreview(objectUrl);

    setUploading(true);
    setError("");
    setProgress(15);

    try {
      // Auto-compress large images for fast and reliable upload
      const fileToUpload = (originalFile.size > 300 * 1024) 
        ? await compressImage(originalFile)
        : originalFile;

      const formData = new FormData();
      formData.append("file", fileToUpload);
      formData.append("folder", folder);

      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const p = 15 + Math.round((event.loaded / event.total) * 80);
            setProgress(p);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.finalUrl) {
                onUploadComplete(data.finalUrl);
                setUploading(false);
                setProgress(100);
                resolve();
              } else {
                const errMsg = data.error || "Upload failed: No URL returned.";
                setError(errMsg);
                setUploading(false);
                reject(new Error(errMsg));
              }
            } catch (err) {
              setError("Upload failed: Invalid server response.");
              setUploading(false);
              reject(new Error("Invalid response"));
            }
          } else {
            let errorMsg = "Upload failed. Server returned an error.";
            try {
              const errData = JSON.parse(xhr.responseText);
              if (errData.error) errorMsg = errData.error;
            } catch (err) {}
            console.error("Upload error details:", xhr.status, xhr.statusText, xhr.responseText);
            setError(errorMsg);
            setUploading(false);
            reject(new Error(errorMsg));
          }
        };

        xhr.onerror = () => {
          console.error("Upload network error");
          setError("Upload failed due to a network error. Please try again.");
          setUploading(false);
          reject(new Error("Network Error"));
        };

        xhr.open("POST", "/api/upload", true);
        xhr.send(formData);
      });
      
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message || "Failed to upload image. Please try again.");
      setUploading(false);
    }
  };

  return (
    <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
      {label && <label className="form-label">{label}</label>}
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {preview && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '8px', 
            backgroundColor: 'var(--surface-color)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--border-color)' 
          }}>
            <img 
              src={preview} 
              alt="Preview" 
              style={{ 
                width: '60px', 
                height: '60px', 
                objectFit: 'cover', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: '#000'
              }} 
              crossOrigin="anonymous" 
            />
            <div style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Image Loaded</span>
            </div>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          style={{ 
            width: '100%', 
            padding: '8px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px dashed var(--border-color)',
            backgroundColor: 'rgba(255,255,255,0.02)',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
        />
        
        {uploading && (
          <div style={{ 
            height: '4px', 
            width: '100%', 
            backgroundColor: 'rgba(255,255,255,0.1)', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              height: '100%', 
              width: `${progress}%`, 
              backgroundColor: 'var(--primary)', 
              transition: 'width 0.3s' 
            }} />
          </div>
        )}

        {uploading && <div style={{ fontSize: '0.7rem', color: 'var(--primary)' }}>Uploading: {progress}%</div>}
        {error && <div style={{ fontSize: '0.7rem', color: 'var(--error)' }}>{error}</div>}
      </div>
    </div>
  );
}
