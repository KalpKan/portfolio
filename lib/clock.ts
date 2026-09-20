/**
 * The two clocks: the lock screen's date + very large time (card 3c) and the
 * menubar's "Sat 20 Sep  11:42" (card 2c). Both are the visitor's local time.
 *
 * CLOCK_SCRIPT runs inline before the first paint (see
 * components/kalpos/InlineScript.tsx and the Next guide "preventing flash
 * before hydration") so the server's placeholder never shows and the clock
 * never shifts layout; the React effect then keeps it ticking.
 */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const pad = (n: number) => String(n).padStart(2, "0");

export function formatLockDate(d: Date): string {
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function formatLockTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatMenubarClock(d: Date): { date: string; time: string } {
  return {
    date: `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`,
    time: formatLockTime(d),
  };
}

export const CLOCK_IDS = { lockDate: "kos-lock-date", lockTime: "kos-lock-time", menubar: "kos-clock" } as const;

export const CLOCK_SCRIPT = `(function(){try{var d=new Date(),D=${JSON.stringify(DAYS)},M=${JSON.stringify(MONTHS)},p=function(n){return String(n).padStart(2,"0")},t=p(d.getHours())+":"+p(d.getMinutes()),s=function(i,v){var n=document.getElementById(i);if(n)n.textContent=v};s("${CLOCK_IDS.lockDate}",D[d.getDay()]+", "+M[d.getMonth()]+" "+d.getDate());s("${CLOCK_IDS.lockTime}",t);s("${CLOCK_IDS.menubar}",D[d.getDay()].slice(0,3)+" "+d.getDate()+" "+M[d.getMonth()].slice(0,3)+"\\u2002\\u2002"+t)}catch(e){}})()`;
