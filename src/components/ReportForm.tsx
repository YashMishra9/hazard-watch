"use client";
import { useRef, useState } from "react";
import { Camera, Crosshair, Loader2, Send, X } from "lucide-react";
import type { HazardCategory, Severity } from "@/types/hazard";
import { CATEGORIES, SEVERITIES } from "@/lib/constants";
import { hazardService } from "@/lib/hazardService";
import { useToast } from "./Toast";

type Errors = Partial<Record<"category" | "severity" | "latitude" | "longitude" | "description" | "photo", string>>;

// Downscale photos so several fit inside localStorage.
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 640 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
    img.src = url;
  });
}

export function ReportForm() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<HazardCategory | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [errors, setErrors] = useState<Errors>({});
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) return toast("Geolocation isn’t supported here. Enter coordinates manually.", "error");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => { setLat(p.coords.latitude.toFixed(6)); setLng(p.coords.longitude.toFixed(6)); setLocating(false); setErrors((e) => ({ ...e, latitude: undefined, longitude: undefined })); },
      () => { setLocating(false); toast("Couldn’t get your location. Allow access or enter coordinates.", "error"); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErrors((e) => ({ ...e, photo: "Choose an image file." }));
    try { setPhoto(await compressImage(file)); setErrors((e) => ({ ...e, photo: undefined })); }
    catch { setErrors((e) => ({ ...e, photo: "That image couldn’t be read." })); }
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!category) e.category = "Choose a hazard type.";
    if (!severity) e.severity = "Choose how severe it is.";
    const la = Number(lat), lo = Number(lng);
    if (lat.trim() === "" || Number.isNaN(la) || la < -90 || la > 90) e.latitude = "Enter a latitude between -90 and 90.";
    if (lng.trim() === "" || Number.isNaN(lo) || lo < -180 || lo > 180) e.longitude = "Enter a longitude between -180 and 180.";
    if (description.length > 500) e.description = "Keep the description under 500 characters.";
    return e;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const r = await hazardService.addReport({
        category: category!, severity: severity!, latitude: Number(lat), longitude: Number(lng),
        description: description.trim() || undefined, photoUrl: photo,
      });
      toast(`Report submitted (${r.id})`);
      setCategory(null); setSeverity(null); setDescription(""); setPhoto(undefined);
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast("Couldn’t save the report. Storage may be full — remove the photo and retry.", "error");
    } finally { setBusy(false); }
  };

  const err = (k: keyof Errors) => errors[k] && <p id={`${k}-err`} className="mt-1 text-xs text-rose-700">{errors[k]}</p>;
  const input = (k: keyof Errors) => `w-full rounded-lg border px-3 py-2.5 text-sm ${errors[k] ? "border-rose-500" : "border-line"} bg-white`;

  return (
    <form onSubmit={submit} noValidate className="space-y-6 rounded-xl border border-line bg-white p-4 sm:p-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">What are you reporting?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map(({ value, label, hint, icon: Icon }) => (
            <label key={value} className={`cursor-pointer rounded-lg border p-3 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-civic ${category === value ? "border-civic bg-civic-soft" : "border-line hover:bg-slate-50"}`}>
              <input type="radio" name="category" value={value} checked={category === value} onChange={() => setCategory(value)} className="sr-only" />
              <Icon size={20} className="mb-1 text-civic" />
              <span className="block font-medium">{label}</span>
              <span className="block text-xs text-slate-500">{hint}</span>
            </label>
          ))}
        </div>
        {err("category")}
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">How severe is it?</legend>
        <div className="grid grid-cols-3 gap-2">
          {SEVERITIES.map((s) => (
            <label key={s.value} className={`cursor-pointer rounded-lg border px-3 py-2.5 text-center text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-civic ${severity === s.value ? "border-civic bg-civic-soft font-medium" : "border-line hover:bg-slate-50"}`}>
              <input type="radio" name="severity" value={s.value} checked={severity === s.value} onChange={() => setSeverity(s.value)} className="sr-only" />
              <span className={`mr-2 inline-block h-2 w-2 rounded-full ${s.bar}`} />{s.label}
            </label>
          ))}
        </div>
        {err("severity")}
      </fieldset>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium">Location</span>
          <button type="button" onClick={locate} disabled={locating} className="inline-flex items-center gap-1.5 rounded-lg border border-civic px-3 py-1.5 text-sm text-civic hover:bg-civic-soft disabled:opacity-60">
            {locating ? <Loader2 className="animate-spin" size={16} /> : <Crosshair size={16} />} Use my location
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="lat" className="mb-1 block text-xs text-slate-600">Latitude</label>
            <input id="lat" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="18.5204" aria-invalid={!!errors.latitude} aria-describedby="latitude-err" className={input("latitude")} />
            {err("latitude")}
          </div>
          <div>
            <label htmlFor="lng" className="mb-1 block text-xs text-slate-600">Longitude</label>
            <input id="lng" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="73.8567" aria-invalid={!!errors.longitude} aria-describedby="longitude-err" className={input("longitude")} />
            {err("longitude")}
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="desc" className="mb-1 block text-sm font-medium">Details <span className="font-normal text-slate-500">(optional)</span></label>
        <textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nearest landmark, how long it has been there…" className={input("description")} />
        <div className="flex justify-between">{err("description") || <span />}<span className="mt-1 text-xs text-slate-500">{description.length}/500</span></div>
      </div>

      <div>
        <span className="mb-2 block text-sm font-medium">Photo <span className="font-normal text-slate-500">(optional)</span></span>
        {photo ? (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt="Selected hazard preview" className="h-40 rounded-lg border border-line object-cover" />
            <button type="button" aria-label="Remove photo" onClick={() => { setPhoto(undefined); if (fileRef.current) fileRef.current.value = ""; }} className="absolute right-2 top-2 rounded-full bg-black/70 p-1 text-white"><X size={14} /></button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-6 text-sm text-slate-600 hover:bg-slate-50">
            <Camera size={18} /> Take or upload a photo
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
          </label>
        )}
        {err("photo")}
      </div>

      <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-civic px-4 py-3 font-medium text-white hover:bg-civic-dark disabled:opacity-60">
        {busy ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />} Submit report
      </button>
    </form>
  );
}
