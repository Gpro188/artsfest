"use client";

import { useState } from "react";
import { saveHomepageSettings } from "./actions";
import ImageUpload from "../../../components/ImageUpload";

export default function HomepageForm({ initialData }: { initialData: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  
  const [primaryColor, setPrimaryColor] = useState(initialData?.primaryColor || "#6366F1");
  const [secondaryColor, setSecondaryColor] = useState(initialData?.secondaryColor || "#0EA5E9");
  const [bgColor, setBgColor] = useState(initialData?.bgColor || "#0F172A");

  const [committee, setCommittee] = useState<any[]>(initialData?.committeeMembers || []);
  const [gallery, setGallery] = useState<string[]>(initialData?.galleryImages || []);

  const addCommitteeMember = () => setCommittee([...committee, { name: "", role: "", imageUrl: "" }]);
  const updateCommittee = (index: number, field: string, value: string) => {
    const newCommittee = [...committee];
    newCommittee[index][field] = value;
    setCommittee(newCommittee);
  };
  const removeCommittee = (index: number) => setCommittee(committee.filter((_, i) => i !== index));

  const addGalleryImage = () => setGallery([...gallery, ""]);
  const updateGallery = (index: number, value: string) => {
    const newGallery = [...gallery];
    newGallery[index] = value;
    setGallery(newGallery);
  };
  const removeGallery = (index: number) => setGallery(gallery.filter((_, i) => i !== index));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Append JSON data
    data.committeeMembers = JSON.stringify(committee);
    data.galleryImages = JSON.stringify(gallery);

    const result = await saveHomepageSettings(data);
    
    setMessage(result.message);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
      {message && (
        <div style={{ padding: 'var(--spacing-md)', backgroundColor: 'var(--surface-hover)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
          {message}
        </div>
      )}

      {/* Hero Section */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Hero Section</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="form-label">Hero Title</label>
            <input type="text" name="heroTitle" defaultValue={initialData?.heroTitle || ""} className="form-input" placeholder="e.g. National Arts Fest 2026" />
          </div>
          <div className="form-group">
            <label className="form-label">Hero Subtitle</label>
            <input type="text" name="heroSubtitle" defaultValue={initialData?.heroSubtitle || ""} className="form-input" placeholder="e.g. Celebrating Creativity" />
          </div>
        </div>
        <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
          <ImageUpload 
            label="Hero Background Image" 
            folder="homepage-hero" 
            initialUrl={initialData?.heroBgUrl}
            onUploadComplete={(url) => {
              // Create a hidden input so the form submission picks it up
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = "heroBgUrl";
              input.value = url;
              document.forms[0].appendChild(input);
            }} 
          />
          {/* Fallback hidden input in case they don't upload a new one */}
          <input type="hidden" name="heroBgUrl" defaultValue={initialData?.heroBgUrl || ""} />
        </div>
      </div>

      {/* Theme Colors & Presets */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-xs)', fontSize: '1.25rem' }}>Theme Colors</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 'var(--spacing-md)' }}>
          Select one of our curated theme presets or customize individual colors.
        </p>

        {/* 3 Preset Theme Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
          {[
            {
              name: "Royal Indigo (Default)",
              primary: "#6366F1",
              secondary: "#0EA5E9",
              bg: "#0F172A",
              desc: "Deep Slate & Electric Violet"
            },
            {
              name: "Cyber Emerald",
              primary: "#10B981",
              secondary: "#06B6D4",
              bg: "#064E3B",
              desc: "Vibrant Green & Deep Teal"
            },
            {
              name: "Gold & Crimson",
              primary: "#F59E0B",
              secondary: "#EC4899",
              bg: "#18181B",
              desc: "Luxury Gold & Sunset Rose"
            }
          ].map((preset) => (
            <div
              key={preset.name}
              onClick={() => {
                setPrimaryColor(preset.primary);
                setSecondaryColor(preset.secondary);
                setBgColor(preset.bg);
              }}
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: primaryColor === preset.primary && secondaryColor === preset.secondary && bgColor === preset.bg
                  ? '2px solid var(--primary)'
                  : '1px solid var(--border-color)',
                background: 'var(--surface-color)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', marginBottom: '0.5rem' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: preset.primary, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: preset.secondary, boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: preset.bg, border: '1px solid #ffffff44', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{preset.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{preset.desc}</div>
            </div>
          ))}
        </div>

        {/* Custom Color Pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-color)' }}>
          <div className="form-group">
            <label className="form-label">Primary Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" name="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '48px', height: '40px', padding: '2px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color-strong)', backgroundColor: 'transparent' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{primaryColor}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Secondary Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" name="secondaryColor" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} style={{ width: '48px', height: '40px', padding: '2px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color-strong)', backgroundColor: 'transparent' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{secondaryColor}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Background Color</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="color" name="bgColor" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '48px', height: '40px', padding: '2px', borderRadius: '6px', cursor: 'pointer', border: '1px solid var(--border-color-strong)', backgroundColor: 'transparent' }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{bgColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>About Section</h2>
        <div className="form-group">
          <label className="form-label">About Title</label>
          <input type="text" name="aboutTitle" defaultValue={initialData?.aboutTitle || "About The Fest"} className="form-input" />
        </div>
        <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
          <ImageUpload 
            label="Pinned Button Logo" 
            folder="homepage-assets" 
            initialUrl={initialData?.pinnedButtonLogoUrl}
            onUploadComplete={(url) => {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = "pinnedButtonLogoUrl";
              input.value = url;
              document.forms[0].appendChild(input);
            }} 
          />
          <input type="hidden" name="pinnedButtonLogoUrl" defaultValue={initialData?.pinnedButtonLogoUrl || ""} />
        </div>
        <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
          <label className="form-label">About Text</label>
          <textarea name="aboutText" defaultValue={initialData?.aboutText || ""} className="form-input" rows={4} placeholder="Write a detailed description of the fest..."></textarea>
        </div>
      </div>

      {/* Program Committee */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Program Committee</h2>
        {committee.map((member, idx) => (
          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr auto', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', alignItems: 'center' }}>
            <input type="text" placeholder="Name" value={member.name} onChange={e => updateCommittee(idx, 'name', e.target.value)} className="form-input" />
            <input type="text" placeholder="Role (e.g. Chairman)" value={member.role} onChange={e => updateCommittee(idx, 'role', e.target.value)} className="form-input" />
            
            <div style={{ minWidth: '200px' }}>
              <ImageUpload 
                label="" 
                folder="committee" 
                initialUrl={member.imageUrl}
                onUploadComplete={(url) => updateCommittee(idx, 'imageUrl', url)} 
              />
            </div>
            
            <button type="button" onClick={() => removeCommittee(idx)} className="btn-secondary" style={{ backgroundColor: 'var(--error)' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addCommitteeMember} className="btn-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>+ Add Member</button>
      </div>

      {/* Gallery Section */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Image Gallery</h2>
        {gallery.map((url, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <ImageUpload 
                label={`Gallery Image ${idx + 1}`} 
                folder="gallery" 
                initialUrl={url}
                onUploadComplete={(uploadedUrl) => updateGallery(idx, uploadedUrl)} 
              />
            </div>
            <button type="button" onClick={() => removeGallery(idx)} className="btn-secondary" style={{ backgroundColor: 'var(--error)' }}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={addGalleryImage} className="btn-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>+ Add Image URL</button>
      </div>

      {/* Stats Section */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Statistics Overrides</h2>
        <span className="field-helper" style={{ display: 'block', marginBottom: 'var(--spacing-md)' }}>Leave values empty to auto-calculate from database where possible.</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="form-label">Stat 1 (Candidates)</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <input type="text" name="stat1Label" defaultValue={initialData?.stat1Label || "Candidates"} className="form-input" placeholder="Label" />
              <input type="text" name="stat1Value" defaultValue={initialData?.stat1Value || ""} className="form-input" placeholder="Value (e.g. 4k+)" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Stat 2 (Institutions)</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <input type="text" name="stat2Label" defaultValue={initialData?.stat2Label || "Institutions"} className="form-input" placeholder="Label" />
              <input type="text" name="stat2Value" defaultValue={initialData?.stat2Value || ""} className="form-input" placeholder="Value" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Stat 3 (Programs)</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <input type="text" name="stat3Label" defaultValue={initialData?.stat3Label || "Programs"} className="form-input" placeholder="Label" />
              <input type="text" name="stat3Value" defaultValue={initialData?.stat3Value || ""} className="form-input" placeholder="Value" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Stat 4 (States)</label>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
              <input type="text" name="stat4Label" defaultValue={initialData?.stat4Label || "States"} className="form-input" placeholder="Label" />
              <input type="text" name="stat4Value" defaultValue={initialData?.stat4Value || ""} className="form-input" placeholder="Value" />
            </div>
          </div>
        </div>
      </div>

      {/* Social Links & Contact */}
      <div className="glass-panel" style={{ padding: 'var(--spacing-lg)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.25rem' }}>Social Links & Contact</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input type="email" name="contactEmail" defaultValue={initialData?.contactEmail || ""} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input type="text" name="contactPhone" defaultValue={initialData?.contactPhone || ""} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Facebook URL</label>
            <input type="url" name="socialFacebook" defaultValue={initialData?.socialFacebook || ""} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Instagram URL</label>
            <input type="url" name="socialInstagram" defaultValue={initialData?.socialInstagram || ""} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">YouTube URL</label>
            <input type="url" name="socialYoutube" defaultValue={initialData?.socialYoutube || ""} className="form-input" />
          </div>
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ width: '100%', padding: 'var(--spacing-md)', fontSize: '1.25rem', marginTop: 'var(--spacing-md)' }}>
        {isSubmitting ? "Saving..." : "Save Homepage Settings"}
      </button>
    </form>
  );
}
