import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { reference as solve } from './catalog-reference.mjs';
import { validateCatalog } from './catalog-validate.mjs';

const data=JSON.parse(await readFile(new URL('../catalog/interview-pilot.json',import.meta.url),'utf8'));
const counts=validateCatalog(data);
let seed=49791,checks=0;
const random=(n)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
function check(id,input,expected){assert.deepEqual(solve[id](structuredClone(input)),expected,id+': independent oracle');checks++;}
for(let trial=0;trial<200;trial++){
  const n=1+random(8),values=Array.from({length:n},()=>random(15)-7);
  let best=-Infinity;
  for(let l=0;l<n;l++)for(let r=l;r<n;r++)best=Math.max(best,values.slice(l,r+1).reduce((a,b)=>a+b,0));
  check('lc:53',{values},best);
  check('lc:238',{values},values.map((_,i)=>values.filter((_,j)=>j!==i).reduce((a,b)=>a*b,1)));
  const k=1+random(n);
  check('lc:239',{values,k},Array.from({length:n-k+1},(_,i)=>Math.max(...values.slice(i,i+k))));
  check('lc:215',{values,k},[...values].sort((a,b)=>b-a)[k-1]);
  let lis=0;
  for(let mask=0;mask<(1<<n);mask++){const a=values.filter((_,i)=>mask&(1<<i));if(a.every((x,i)=>i===0||a[i-1]<x))lis=Math.max(lis,a.length);}
  check('lc:300',{values},lis);
  const positive=values.map(x=>Math.abs(x)+1),target=1+random(25);let shortest=Infinity;
  for(let l=0;l<n;l++)for(let r=l;r<n;r++)if(positive.slice(l,r+1).reduce((a,b)=>a+b,0)>=target)shortest=Math.min(shortest,r-l+1);
  check('lc:209',{values:positive,target},Number.isFinite(shortest)?shortest:0);
  const queries=Array.from({length:8},()=>{const a=random(n),b=random(n);return [Math.min(a,b),Math.max(a,b)];});
  check('lc:303',{values,queries},queries.map(([l,r])=>values.slice(l,r+1).reduce((a,b)=>a+b,0)));
  const current=[...values],operations=[],answers=[];
  for(let op=0;op<20;op++)if(random(2)){const index=random(n),value=random(50)-25;operations.push(['set',index,value]);current[index]=value;}else{const a=random(n),b=random(n),l=Math.min(a,b),r=Math.max(a,b);operations.push(['sum',l,r]);answers.push(current.slice(l,r+1).reduce((a,b)=>a+b,0));}
  check('cses:1648',{values,operations},answers);
  const value=random(2147483647);check('lc:69',{value},Math.floor(Math.sqrt(value)));
  const unsigned=(Math.imul(value,3))>>>0;check('lc:191',{value:unsigned},unsigned.toString(2).split('1').length-1);
  const jumps=Array.from({length:n},()=>random(4)),reachable=new Set([0]);
  for(let i=0;i<n;i++)if(reachable.has(i))for(let j=1;j<=jumps[i]&&i+j<n;j++)reachable.add(i+j);
  check('lc:55',{jumps},reachable.has(n-1));
}
check('lc:200',{grid:Array.from({length:300},()=>Array(300).fill(1))},1);
check('lc:191',{value:4294967295},32);
check('lc:70',{steps:40},165580141);
check('lc:141',{values:[1],tailNext:0},true);
check('lc:133',{adjacency:[[2],[1]]},[[2],[1]]);
const deep=[0];for(let i=1;i<10000;i++)deep.push(null,i);
check('lc:104',{tree:deep},10000);
check('lc:98',{tree:deep},true);
console.log(`PASS: ${counts.questions} questions, ${counts.examples} authored examples, ${counts.sourceLinks} unique practice links.`);
console.log(`PASS: ${checks} additional differential and boundary checks against independent oracles.`);
