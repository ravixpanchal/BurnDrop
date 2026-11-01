'use client';
import { useRef, useState } from 'react';
import { UploadZone } from './UploadZone';
import { UploadProgress } from './UploadProgress';
import { ShareCodeCard } from './ShareCodeCard';
import { ApiError, ShareCreateResponse, uploadFiles } from '@/lib/api';
import { config, maxFileSizeBytes } from '@/lib/config';
export function UploadForm() {
 const [files,setFiles]=useState<File[]>([]);
 const [email,setEmail]=useState('');
 const [touched,setTouched]=useState(false);
 const [busy,setBusy]=useState(false);
 const [progress,setProgress]=useState({percent:0,loaded:0,total:0});
 const [result,setResult]=useState<ShareCreateResponse|null>(null);
 const [error,setError]=useState('');
 const controller=useRef<AbortController|null>(null);
 const valid=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
 async function submit(e:React.FormEvent) {
  e.preventDefault(); setTouched(true);
  if(!valid || !files.length || busy) return;
  if(files.reduce((n,f)=>n+f.size,0)>maxFileSizeBytes) {setError('Your files exceed the total upload limit. Remove a file and try again.');return;}
  const request=new AbortController(); controller.current=request;
  setBusy(true);setError('');setProgress({percent:0,loaded:0,total:files.reduce((n,f)=>n+f.size,0)});
  try {setResult(await uploadFiles(files,email.trim(),(percent,loaded,total)=>setProgress({percent,loaded,total}),request.signal));}
  catch(err) {setError(request.signal.aborted?'Upload cancelled. Your selection is saved; you can try again.':err instanceof ApiError?err.message:'Could not finish uploading. Check your connection and try again.');}
  finally {setBusy(false);controller.current=null;}
 }
 if(result) return <div className="space-y-5"><ShareCodeCard code={result.code} expiresAt={result.expires_at} emailSent={result.email_sent} filename={result.filename} sizeBytes={result.size_bytes} fileCount={files.length}/><button className="btn-secondary w-full" onClick={()=>{setResult(null);setFiles([]);setEmail('');setTouched(false);setError('');}}>Send more files</button></div>;
 return <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
  {busy?<><UploadProgress {...progress}/><button type="button" className="btn-secondary w-full" onClick={()=>controller.current?.abort()}>Cancel upload</button></>:<UploadZone files={files} onFilesSelect={(next)=>{setFiles(next);setError('');}}/>}
  <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
   <label htmlFor="email" className="mb-2 block text-sm font-semibold">Recipient email</label>
   <input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} onBlur={()=>setTouched(true)} placeholder="friend@example.com" className="input-field" disabled={busy} required aria-invalid={touched&&!valid} aria-describedby="email-help email-error"/>
   <p id="email-help" className="mt-2 text-sm leading-relaxed text-slate-600">We’ll email the access code to this address. You can also copy and share it yourself after uploading.</p>
   <p id="email-error" className="mt-2 text-sm text-rose-700" aria-live="polite">{touched&&!valid?'Enter a valid email address, such as friend@example.com.':''}</p>
  </div>
  {error&&<div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
  <button className="btn-primary w-full" disabled={!files.length||!valid||busy}>{busy?'Uploading…':error?'Try upload again':'Create sharing code'}</button>
  <p className="text-center text-sm leading-relaxed text-slate-600">Access expires after {config.fileExpirationHours} hours. Keep the code private.</p>
 </form>;
}
