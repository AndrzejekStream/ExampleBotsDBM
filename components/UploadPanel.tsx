"use client";

import { useState } from "react";

export default function UploadPanel({
  onUpload
}: {
  onUpload: (file: File) => void;
}) {
  const [dragActive, setDragActive] = useState(false);

  return (
    <div
      className={`rounded-xl border border-dashed p-6 transition ${dragActive ? "border-accent bg-slate-900" : "border-slate-700"}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragActive(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onUpload(file);
      }}
    >
      <div className="flex flex-col gap-3">
        <p className="text-sm text-slate-300">Drag & drop CSV or use the file picker.</p>
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-slate-900">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
          Upload CSV
        </label>
      </div>
    </div>
  );
}
