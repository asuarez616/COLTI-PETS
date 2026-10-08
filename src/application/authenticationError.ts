/** Supabase codes only; never expose server text or submitted credentials. */
export function authenticationErrorMessage(error:unknown):string|null{
 if(!error||typeof error!=='object')return null;
 const code='code' in error?error.code:null;
 if(code==='invalid_credentials')return 'Email or password is incorrect. Use the password you created for the administrator user, not the database password.';
 if(code==='email_not_confirmed')return 'Your administrator email has not been confirmed. Confirm it before signing in.';
 if(code==='over_request_rate_limit'||code==='over_email_send_rate_limit')return 'Too many sign-in attempts. Please wait a moment before trying again.';
 if('name' in error&&error.name==='AuthRetryableFetchError')return 'Could not connect to the sign-in service. Check your connection and try again.';
 return null;
}
