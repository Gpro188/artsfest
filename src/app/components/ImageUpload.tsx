"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  folder?: string;
  label?: string;
}

export default function ImageUpload({ onUploadComplete, folder = "general", label = "Upload Image" }: ImageUploadProps) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 100KB as requested)
    if (file.size > 100 * 1024) {
      setError("File is too large. Max size is 100KB to save space.");
      return;
    }

    setUploading(true);
    setError("");
    
    const fileName = `${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, fileName);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(p));
      },
      (err) => {
        console.error("Upload error:", err);
        setError("Upload failed. Check your Firebase permissions.");
        setUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          onUploadComplete(downloadURL);
          setUploading(false);
          setProgress(0);
        });
      }
    );
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ position: 'relative' }}>
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
            marginTop: '8px', 
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

        {uploading && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '4px' }}>Uploading: {progress}%</div>}
        {error && <div style={{ fontSize: '0.7rem', color: 'var(--error)', marginTop: '4px' }}>{error}</div>}
      </div>
    </div>
  );
}
