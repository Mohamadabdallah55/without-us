import { useEffect, useState } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { LogIn, LogOut, UserRound } from 'lucide-react';
import config from '../../firebase-applet-config.json';

// Identity is optional and scoped to this origin. It does not grant admin or room privileges.
const auth = getAuth(getApps().length ? getApp() : initializeApp(config));
const provider = new GoogleAuthProvider();

export default function PlayerAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  useEffect(() => onAuthStateChanged(auth, value => {setUser(value); setReady(true);}, () => setReady(true)), []);
  async function login() {
    if (busy) return;
    setError(''); setBusy(true);
    try { await signInWithPopup(auth, provider); setOpen(false); }
    catch (err) {
      const code = (err as {code?:string})?.code;
      setError(code === 'auth/unauthorized-domain' ? 'يجب إضافة نطاق اللعبة إلى Firebase Authorized domains.' :
        code === 'auth/popup-blocked' ? 'اسمح بالنوافذ المنبثقة وحاول مرة أخرى.' :
        code === 'auth/popup-closed-by-user' ? 'تم إغلاق نافذة الدخول.' : 'تعذر تسجيل الدخول. يمكنك اللعب بدون حساب.');
    } finally {setBusy(false);}
  }
  return <div className="party-account">
    <button type="button" disabled={!ready || busy} onClick={() => {if(user) setOpen(!open); else void login();}}>
      {user ? <UserRound size={17}/> : <LogIn size={17}/>} <span>{busy ? 'جارٍ الدخول…' : user ? (user.displayName?.split(' ')[0] || 'حسابي') : 'دخول Google'}</span>
    </button>
    {error && <p className="party-account-error" role="alert">{error}</p>}
    {open && user && <div className="party-account-menu">
      <strong>{user.displayName || 'حسابي'}</strong><p>حساب Google للعبة. حفظ المباريات يبقى على جهازك أو في الغرفة الحالية.</p>
      <button type="button" onClick={async () => {try {await signOut(auth);setOpen(false);} catch {setError('تعذر تسجيل الخروج.');}}}><LogOut size={16}/> تسجيل الخروج</button>
    </div>}
  </div>;
}
