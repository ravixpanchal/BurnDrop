'use client';
import { useEffect, useState } from 'react';
import { formatBytes, formatExpiryCountdown } from '@/lib/config';
interface Props { code:string; expiresAt:string; emailSent:boolean; filename:string; sizeBytes:number; fileCount?:number; }
export function ShareCodeCard({code,expiresAt,emailSent,filename,sizeBytes,fileCount=1}:Props) {
 const [remaining,setRemaining]=useState(formatExpiryCountdown(expiresAt));
 const [message,setMessage]=useState('');
 useEffect(()=>{const timer=setInterval(()=>setRemaining(formatExpiryCountdown(expiresAt)),1000);return()=>clearInterval(timer);},[expiresAt]);
 async function copy(){try{await navigator.clipboard.writeText(code);setMessage('Code copied.');}catch{setMessage('Copy unavailable. Select the code above and copy it manually.');}}
 const expired=remaining==='Expired';
 return <section className="rounded-xl border border-slate-200 bg-white p-6 text-center sm:p-8" aria-label="Sharing code">
  <p className="text-sm font-semibold text-emerald-700" role="status">{expired?'This share has expired':'Upload complete'}</p>
  <h2 className="mt-2 text-2xl font-bold">{expired?'Create a new share to send again.':'Your files are ready to share.'}</h2>
  <p className="mt-3 break-words text-sm text-slate-600">{fileCount>1?`${fileCount} files`:filename} · {formatBytes(sizeBytes)}</p>
  <div className="my-6 rounded-xl border border-brand-200 bg-brand-50 p-5"><p className="text-sm font-medium text-brand-700">One-time access code</p><p className="mt-3 select-all break-all font-mono text-3xl font-bold tracking-widest sm:text-4xl">{code}</p></div>
  <button type="button" onClick={copy} disabled={expired} className="btn-primary w-full">Copy code</button>
  <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>
  <p className="mt-5 text-sm text-slate-700">{emailSent?'Email sent. If it hasn’t arrived, ask the recipient to check Spam or Junk.':'Email could not be delivered. Copy the code and share it with your recipient.'}</p>
  <p className="mt-4 text-sm text-slate-600">{expired?'Access expired':`Expires in ${remaining}`}</p>
  <p className="mt-3 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">Anyone with this code can access your files. Share it only with your intended recipient.</p>
 </section>;
}
