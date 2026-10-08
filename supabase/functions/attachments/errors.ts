/** Stable public codes only. Never return PostgREST/database diagnostics. */
export function attachmentError(value:unknown){
 const e=value as {message?:unknown;code?:unknown}|null;
 const message=typeof e?.message==='string'?e.message:'';
 const allowed=['AUTH_REQUIRED','INVALID_FILE','FILE_LIMIT','UPLOAD_RATE_LIMIT','ATTACHMENT_STATE_CONFLICT','INVALID_ATTACHMENT','UPLOAD_NOT_FOUND','INVALID_FILE_CONTENT'];
 const code=allowed.find(k=>message===k)||((e?.code==='42501')?'PERMISSION_DENIED':'UPLOAD_FAILED');
 return {code,status:code==='AUTH_REQUIRED'?401:code==='PERMISSION_DENIED'?403:code==='UPLOAD_FAILED'?500:400};
}
