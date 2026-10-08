import {expect,it} from 'vitest';
import {authenticationErrorMessage} from './authenticationError';
it('distinguishes rejected credentials, unconfirmed email and connection errors without exposing server details',()=>{
 expect(authenticationErrorMessage({code:'invalid_credentials',message:'private server details'})).toContain('Email or password is incorrect');
 expect(authenticationErrorMessage({code:'email_not_confirmed'})).toContain('has not been confirmed');
 expect(authenticationErrorMessage({name:'AuthRetryableFetchError'})).toContain('Could not connect');
 expect(authenticationErrorMessage({code:'over_request_rate_limit'})).toContain('Too many');
 expect(authenticationErrorMessage({code:'unknown',message:'secret'})).toBeNull();
 expect(authenticationErrorMessage(null)).toBeNull();
});
