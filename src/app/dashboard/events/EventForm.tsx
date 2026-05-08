"use client";

import { useState } from "react";
import { createEvent } from "./actions";

export default function EventForm() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await createEvent(name);
    
    setName("");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Event Name</label>
        <input 
          type="text" 
          className="form-input" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Hifz Fest 2026"
          required
        />
      </div>
      
      <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
        {loading ? "Creating..." : "Create Event"}
      </button>
    </form>
  );
}
