import {expect,it} from 'vitest';
import {recoveryTokens,validRecoveryPassword,passwordRecoveryError} from './passwordRecovery';
it('accepts only complete password recovery links',()=>{
 expect(recoveryTokens('#access_token=a&refresh_token=b&type=recovery')).toEqual({access_token:'a',refresh_token:'b'});
 expect(recoveryTokens('#access_token=a&refresh_token=b&type=signup')).toBeNull();
 expect(recoveryTokens('#type=recovery&access_token=a')).toBeNull();
});
it('requires a matching password of at least eight characters',()=>{
 expect(validRecoveryPassword('example123','example123')).toBe(true);
 expect(validRecoveryPassword('short','short')).toBe(false);
 expect(validRecoveryPassword('example123','different')).toBe(false);
});
it('reports provider rejection codes without exposing private server details',()=>{
 expect(passwordRecoveryError({code:'same_password'})).toContain('igual a la actual');
 expect(passwordRecoveryError({code:'weak_password'})).toContain('por seguridad');
 expect(passwordRecoveryError({code:'session_not_found'})).toContain('venció');
 expect(passwordRecoveryError({code:'over_request_rate_limit'})).toContain('Demasiados');
 expect(passwordRecoveryError({message:'private'})).not.toContain('private');
});
