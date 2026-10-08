export function validRecoveryPassword(password:string,confirmation:string){return password.length>=8&&password===confirmation;}
export function passwordRecoveryError(error:unknown){
 const code=error&&typeof error==='object'&&'code' in error?error.code:null;
 if(code==='same_password')return 'La contraseña ingresada es igual a la actual. Escribe una contraseña diferente.';
 if(code==='weak_password')return 'Supabase rechazó esta contraseña por seguridad. Usa una contraseña más larga y difícil de adivinar.';
 if(code==='session_not_found'||code==='refresh_token_not_found'||code==='refresh_token_already_used')return 'La sesión de recuperación venció. Solicita un nuevo enlace.';
 if(code==='over_request_rate_limit')return 'Demasiados intentos. Espera un momento antes de reintentar.';
 return 'No se pudo actualizar la contraseña. Reintenta o solicita un nuevo enlace.';
}
export function recoveryTokens(hash:string){
 const values=new URLSearchParams(hash.replace(/^#/,''));
 const access_token=values.get('access_token'),refresh_token=values.get('refresh_token');
 return values.get('type')==='recovery'&&access_token&&refresh_token?{access_token,refresh_token}:null;
}
