import {useState,useEffect} from 'react';
import {Volume2,VolumeX} from 'lucide-react';
import {soundFx,type SoundMode} from '../utils/sound';
import {writeSession} from '../game/session';
const steps=[{label:'البطاقات',phases:['LOBBY','SECRET_REVEAL']},{label:'المواجهات',phases:['PLAYER_QUESTIONS','DISCUSSION']},{label:'التصويت',phases:['SUSPICION_MOMENT','VOTING','TIE_BREAKER','OUTLIER_GUESS']},{label:'كشف الحقيقة',phases:['REVEAL','RESULTS','FINAL_WINNER']}];
export function MatchProgress({phase,round,total}:{phase:string;round:number;total:number}){
 const active=Math.max(0,steps.findIndex(s=>s.phases.includes(phase)));
 return <div className="kh-progress" aria-label={'مرحلة المباراة: '+steps[active].label}><div className="kh-round">جولة <b>{round||1}/{total}</b></div><div className="kh-steps">{steps.map((s,i)=><div key={s.label} className={i===active?'kh-current':i<active?'kh-done':''} aria-current={i===active?'step':undefined}><b>{i<active?'✓':i+1}</b><span>{s.label}</span></div>)}</div></div>;
}
export function StageSound(){
 const [mode,setMode]=useState<SoundMode>(()=>soundFx.getMode());
 useEffect(()=>{setMode(soundFx.getMode());},[]);
 function toggle(){const next=mode==='muted'?'quiet':mode==='quiet'?'on':'muted';soundFx.setMode(next);setMode(next);writeSession('khalf_sound',next);soundFx.unlock();soundFx.playTap();}
 return <button type="button" className="kh-sound" onClick={toggle} aria-label={'الصوت: '+(mode==='muted'?'مكتوم':mode==='quiet'?'هادئ':'شغال')} title="تغيير مستوى الصوت">{mode==='muted'?<VolumeX size={17}/>:<Volume2 size={17}/>}<span>{mode==='muted'?'مكتوم':mode==='quiet'?'هادئ':'صوت'}</span></button>;
}
