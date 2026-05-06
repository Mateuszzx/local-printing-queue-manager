import React from 'react';
import './UploadForm.css';

export default function UploadForm({ config, onUpload }) {
  return (
    <form className="upload-form" onSubmit={onUpload} encType="multipart/form-data">
      <div className="form-group">
        <label>File</label>
        <input name="file" type="file" required />
      </div>

      <div className="form-group">
        <label>Printer</label>
        <select name="printer" required>
          {config.printers.map(p => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Material</label>
        <select name="material" required>
          {config.materials.map(m => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Infill</label>
        <select name="infill" required>
          {config.infill.map(i => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Infill Type</label>
        <select name="infill_type" required>
          {config.infill_type.map(i => (
            <option key={i}>{i}</option>
          ))}
        </select>
      </div>

      <div className="form-group checkbox-group">
        <label>
          <input type="checkbox" name="supports" /> Supports
        </label>
      </div>

      <div className="form-group">
        <label>Perimeters</label>
        <input
          type="number"
          name="perimeters"
          defaultValue={2}
          min={1}
          placeholder="Perimeters"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea name="description" placeholder="Short description..." />
      </div>

      <button type="submit" className="upload-btn">📤 Upload</button>
    </form>
  );
}
