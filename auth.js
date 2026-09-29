import {authConfig} from './config.js';
const $=id=>document.getElementById(id);
export let client=null;
let mode='signin', activeUser=null;
const redirectTo=new URL('./',location.href).href;
const listeners=new Set();
export function onAccount(callback){listeners.add(callback);}
function announce(user){activeUser=user;$('auth-screen').hidden=!!user;$('radio-app').hidden=!user;$('account-name').textContent=user?.user_metadata?.display_name||'CULTURE MEMBER';for(const listener of listeners)listener(user);}
function setMode(next){mode=next;const signup=next==='signup',reset=next==='reset',recovery=next==='recovery';$('auth-title').textContent=signup?'Join the culture.':reset?'Reset password.':recovery?'Choose a password.':'Sign in.';$('auth-subtitle').textContent=signup?'Create your own space for radio.':reset?'We’ll send you a secure reset link.':recovery?'Set a new password for your account.':'Your stations. Ready when you are.';$('name-field').hidden=!signup;$('auth-name').required=signup;$('email-field').hidden=recovery;$('auth-email').required=!recovery;$('password-field').hidden=reset;$('auth-password').required=!reset;$('auth-password').minLength=next==='signin'?1:8;$('auth-password').autocomplete=signup||recovery?'new-password':'current-password';$('auth-submit').textContent=signup?'Create account ↗':reset?'Send reset link ↗':recovery?'Save password ↗':'Sign in ↗';$('auth-switch-label').textContent=next==='signin'?'New to the culture?':'Already part of the culture?';$('auth-switch').textContent=next==='signin'?'Create an account':'Back to sign in';$('auth-reset').hidden=next!=='signin';$('auth-message').textContent='';$('auth-password').value='';}
$('auth-switch').addEventListener('click',()=>setMode(mode==='signin'?'signup':'signin'));
$('auth-reset').addEventListener('click',()=>setMode('reset'));
$('auth-form').addEventListener('submit',async e=>{
  e.preventDefault();if(!client){$('auth-message').textContent='Account setup is in progress. Please try again once the service is connected.';return;}
  const button=$('auth-submit');button.disabled=true;$('auth-message').textContent='Connecting securely…';
  const email=$('auth-email').value.trim(),password=$('auth-password').value;
  try{
    if(mode==='signin'){const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;}
    else if(mode==='signup'){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:redirectTo,data:{display_name:$('auth-name').value.trim()}}});if(error)throw error;$('auth-message').textContent=data.session?'Account created.':'Check your email to confirm your account, then return here to sign in.';}
    else if(mode==='reset'){const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;$('auth-message').textContent='If that email has an account, a password reset link is on its way.';}
    else {const {error}=await client.auth.updateUser({password});if(error)throw error;setMode('signin');const {data}=await client.auth.getSession();announce(data.session?.user||null);}
  }catch(error){$('auth-message').textContent=error.message||'Could not connect. Please try again.';}finally{button.disabled=false;$('auth-password').value='';}
});
$('sign-out').addEventListener('click',async()=>{const {error}=await client.auth.signOut({scope:'local'});if(error){$('sync-status').textContent='Sign out could not finish. Please retry when online.';return;}setMode('signin');announce(null);});
export async function initAuth(){
  if(!authConfig.url||!authConfig.publishableKey){$('auth-message').textContent='Account service setup is in progress.';$('auth-submit').disabled=true;return;}
  if(!window.supabase){$('auth-message').textContent='Sign-in could not load. Refresh to retry.';return;}
  client=window.supabase.createClient(authConfig.url,authConfig.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'culture-radio-auth'}});
  client.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY'){announce(null);setMode('recovery');return;}
    if(mode==='recovery'&&session)return;
    // Defer listeners to avoid invoking Supabase queries inside its auth lock.
    if(event==='INITIAL_SESSION'||event==='SIGNED_OUT'||session?.user?.id!==activeUser?.id)setTimeout(()=>announce(session?.user||null),0);
  });
  const {data,error}=await client.auth.getSession();
  if(error){$('auth-message').textContent='Could not restore your session. Sign in again.';return;}
  if(mode!=='recovery')announce(data.session?.user||null);
}
