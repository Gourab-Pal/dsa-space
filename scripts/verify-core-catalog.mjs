import assert from 'node:assert/strict';
import {coreReference as solve} from './catalog-core-reference.mjs';
// Differential tests deliberately use brute force, built-ins or different algorithms.
export function verifyCore(){
 let checks=0,seed=85937;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 const same=(id,input,expected)=>{assert.deepEqual(solve[id](structuredClone(input)),expected,id+': independent oracle');checks++;};
 const close=(id,input,expected)=>{const actual=solve[id](input);assert.ok(Math.abs(actual-expected)<=1e-10*Math.max(1,Math.abs(expected)),id);checks++;};
 const normalize=arrays=>arrays.map(a=>JSON.stringify(a)).sort();
 for(let trial=0;trial<150;trial++){
  const n=1+random(7),values=Array.from({length:n},()=>random(11)-5),sorted=[...values].sort((a,b)=>a-b),k=1+random(n);
  same('lc:217',{values},values.some((x,i)=>values.indexOf(x)!==i));
  let run=0,longest=0,previous=null;for(const x of [...new Set(values)].sort((a,b)=>a-b)){run=previous!==null&&x===previous+1?run+1:1;longest=Math.max(longest,run);previous=x;}same('lc:128',{values},longest);
  const shift=random(20),r=shift%n;same('lc:189',{values,k:shift},r?values.slice(-r).concat(values.slice(0,-r)):values);
  same('lc:977',{values:sorted},values.map(x=>x*x).sort((a,b)=>a-b));
  const colors=values.map(x=>Math.abs(x)%3);same('lc:75',{values:colors},[...colors].sort());
  same('lc:88',{first:sorted,second:[-4,2,8]},sorted.concat([-4,2,8]).sort((a,b)=>a-b));
  same('lc:26',{values:sorted},[...new Set(sorted)]);
  const triples=new Set();for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let l=j+1;l<n;l++)if(values[i]+values[j]+values[l]===0)triples.add(JSON.stringify([values[i],values[j],values[l]].sort((a,b)=>a-b)));
  assert.deepEqual(normalize(solve['lc:15']({values})),[...triples].sort());checks++;
  const heights=values.map(Math.abs);let rain=0,rectangle=0;
  for(let i=0;i<n;i++)rain+=Math.min(Math.max(...heights.slice(0,i+1)),Math.max(...heights.slice(i)))-heights[i];
  for(let i=0;i<n;i++)for(let j=i;j<n;j++)rectangle=Math.max(rectangle,(j-i+1)*Math.min(...heights.slice(i,j+1)));
  same('lc:42',{heights},rain);same('lc:84',{heights},rectangle);
  const text=Array.from({length:n},()=>String.fromCharCode(97+random(3))).join(''),pattern=Array.from({length:1+random(3)},()=>String.fromCharCode(97+random(3))).join('');
  same('lc:28',{text,pattern},text.indexOf(pattern));
  const anagrams=[];for(let i=0;i+pattern.length<=text.length;i++)if([...text.slice(i,i+pattern.length)].sort().join('')===[...pattern].sort().join(''))anagrams.push(i);
  same('lc:438',{text,pattern},anagrams);same('lc:567',{text,pattern},anagrams.length>0);
  let replacement=0,cover='',coverLength=Infinity,palCount=0,pal='';const budget=random(3);
  const required=[...pattern],need=new Map();for(const c of required)need.set(c,(need.get(c)||0)+1);
  for(let i=0;i<text.length;i++)for(let j=i+1;j<=text.length;j++){
   const piece=text.slice(i,j),counts=new Map();for(const c of piece)counts.set(c,(counts.get(c)||0)+1);
   if(piece.length-Math.max(...counts.values())<=budget)replacement=Math.max(replacement,piece.length);
   if([...need].every(([c,n])=>(counts.get(c)||0)>=n)&&piece.length<coverLength){cover=piece;coverLength=piece.length;}
   if(piece===[...piece].reverse().join('')){palCount++;if(piece.length>pal.length)pal=piece;}
  }
  same('lc:424',{text:text.toUpperCase(),k:budget},replacement);same('lc:76',{text,required:pattern},cover);same('lc:5',{text},pal);same('lc:647',{text},palCount);
  const binary=values.map(x=>Math.abs(x)%2);let bestOnes=0;
  for(let i=0;i<n;i++)for(let j=i;j<n;j++)if(binary.slice(i,j+1).filter(x=>x===0).length<=budget)bestOnes=Math.max(bestOnes,j-i+1);
  same('lc:1004',{values:binary,k:budget},bestOnes);
  close('lc:643',{values,k},Math.max(...Array.from({length:n-k+1},(_,i)=>values.slice(i,i+k).reduce((a,b)=>a+b,0)/k)));
  const unique=[...new Set(values)],query=unique.slice().reverse();same('lc:496',{query,values:unique},query.map(x=>unique.slice(unique.indexOf(x)+1).find(y=>y>x)??-1));
  const repeat=1+random(4),inner=1+random(4);same('lc:394',{text:`${repeat}[x${inner}[y]]`},('x'+'y'.repeat(inner)).repeat(repeat));
  const ordered=Array.from({length:n},(_,i)=>i*3-9),rotation=random(n),rotated=ordered.slice(rotation).concat(ordered.slice(0,rotation));same('lc:153',{values:rotated},Math.min(...ordered));
  const piles=heights.map(x=>x+1),hours=piles.length+random(10);let rate=1;while(piles.reduce((s,p)=>s+Math.ceil(p/rate),0)>hours)rate++;same('lc:875',{piles,hours},rate);
  const split=random(n+1),a=sorted.slice(0,split),b=sorted.slice(split),median=n%2?sorted[(n-1)/2]:(sorted[n/2-1]+sorted[n/2])/2;same('lc:4',{first:a,second:b},median);
  const first=random(1000000),second=random(1000000),digits=x=>String(x).split('').reverse().map(Number);same('lc:2',{first:digits(first),second:digits(second)},digits(first+second));
  let bestLine=0,bestCircle=0,equalHalf=false,targetWays=0;const positives=heights.map(x=>x+1),total=positives.reduce((a,b)=>a+b,0),target=random(11)-5;
  const subsetSet=new Set();for(let mask=0;mask<(1<<n);mask++){
   let sum=0,signed=0;const subset=[];for(let i=0;i<n;i++){if(mask&(1<<i)){sum+=positives[i];subset.push(values[i]);signed+=heights[i];}else signed-=heights[i];}
   subsetSet.add(JSON.stringify(subset.sort((a,b)=>a-b)));if(sum*2===total)equalHalf=true;if(signed===target)targetWays++;
   if(!(mask&(mask<<1))){bestLine=Math.max(bestLine,sum);if(n===1||!((mask&1)&&(mask&(1<<(n-1)))))bestCircle=Math.max(bestCircle,sum);}
  }
  same('lc:198',{values:positives},bestLine);same('lc:213',{values:positives},bestCircle);same('lc:416',{values:positives},equalHalf);same('lc:494',{values:heights,target},targetWays);
  assert.deepEqual(normalize(solve['lc:90']({values})),[...subsetSet].sort());checks++;
  let productBest=-Infinity;for(let i=0;i<n;i++){let p=1;for(let j=i;j<n;j++){p*=values[j];productBest=Math.max(productBest,p);}}same('lc:152',{values},productBest===0?0:productBest);
  const rows=1+random(5),columns=1+random(5);let routes=1;for(let i=1;i<=rows-1;i++)routes=routes*(columns-1+i)/i;same('lc:62',{rows,columns},Math.round(routes));
  const coins=[...new Set(positives)],amount=random(15);function combinations(i,left){if(i===coins.length)return left===0?1:0;let count=0;for(let used=0;used*coins[i]<=left;used++)count+=combinations(i+1,left-used*coins[i]);return count;}
  same('lc:518',{coins,amount},combinations(0,amount));
  const intervals=Array.from({length:random(5)},(_,i)=>[i*3,i*3+1]),x=random(15),y=random(15),added=[Math.min(x,y),Math.max(x,y)],merged=[];for(const [l,r] of intervals.concat([added]).sort((a,b)=>a[0]-b[0])){if(merged.length&&l<=merged.at(-1)[1])merged.at(-1)[1]=Math.max(r,merged.at(-1)[1]);else merged.push([l,r]);}same('lc:57',{intervals,added},merged);
  const operations=[],numbers=[],medians=[];for(let i=0;i<n;i++){operations.push(['add',values[i]],['median']);numbers.push(values[i]);const sortedNumbers=[...numbers].sort((a,b)=>a-b),m=sortedNumbers.length;medians.push(m%2?sortedNumbers[(m-1)/2]:(sortedNumbers[m/2-1]+sortedNumbers[m/2])/2);}same('lc:295',{operations},medians);
  const points=values.map((x,i)=>[x,heights[i]]),count=random(n+1),rank=(a,b)=>(a[0]**2+a[1]**2)-(b[0]**2+b[1]**2)||a[0]-b[0]||a[1]-b[1];same('lc:973',{points,k:count},[...points].sort(rank).slice(0,count));
  const limit=random(60);same('lc:338',{limit},Array.from({length:limit+1},(_,i)=>i.toString(2).split('1').length-1));
  const unsigned=(Math.imul(random(2147483647),3))>>>0;same('lc:190',{value:unsigned},parseInt(unsigned.toString(2).padStart(32,'0').split('').reverse().join(''),2));
  const base=random(11)-5,exponent=random(15)-7;if(base!==0||exponent>=0)close('lc:50',{base,exponent},Math.pow(base,exponent));
  let primes=0;for(let x=2;x<limit;x++){let prime=true;for(let d=2;d*d<=x;d++)if(x%d===0){prime=false;break;}if(prime)primes++;}same('lc:204',{limit},primes);
  function frog(i){if(i===heights.length-1)return 0;let best=Infinity;for(let jump=1;jump<=2&&i+jump<heights.length;jump++)best=Math.min(best,Math.abs(heights[i+jump]-heights[i])+frog(i+jump));return best;}same('ac:dp_a',{heights},frog(0));
  const value=random(150);function exchange(n){return n<2?n:Math.max(n,exchange(Math.floor(n/2))+exchange(Math.floor(n/3))+exchange(Math.floor(n/4)));}same('cc:COINS',{value},exchange(value));
  const positions=[...new Set(Array.from({length:8},()=>random(30)))].sort((a,b)=>a-b);if(positions.length>=2){const count=2+random(positions.length-1);let spacing=0;for(let mask=0;mask<(1<<positions.length);mask++){const selected=positions.filter((_,i)=>mask&(1<<i));if(selected.length!==count)continue;spacing=Math.max(spacing,Math.min(...selected.slice(1).map((x,i)=>x-selected[i])));}same('spoj:AGGRCOW',{positions,count},spacing);}
  const names=Array.from({length:n},()=>['oak','elm','pine'][random(3)]);same('cf:4C',{names},names.map((x,i)=>{const previous=names.slice(0,i).filter(y=>y===x).length;return previous?x+previous:'OK';}));
  // Floyd–Warshall independently checks both weighted and unweighted graph paths.
  const nodes=1+random(5),edges=[],dist=Array.from({length:nodes},(_,i)=>Array.from({length:nodes},(_,j)=>i===j?0:Infinity));
  for(let u=0;u<nodes;u++)for(let v=0;v<nodes;v++)if(u!==v&&random(3)===0){const w=random(7);edges.push([u+1,v+1,w]);dist[u][v]=Math.min(dist[u][v],w);}
  for(let k=0;k<nodes;k++)for(let i=0;i<nodes;i++)for(let j=0;j<nodes;j++)dist[i][j]=Math.min(dist[i][j],dist[i][k]+dist[k][j]);
  const largest=Math.max(...dist[0]);same('lc:743',{nodes,edges,start:1},Number.isFinite(largest)?largest:-1);
  const undirected=[];for(let u=0;u<nodes;u++)for(let v=u+1;v<nodes;v++)if(random(2))undirected.push([u,v]);
  const d=Array.from({length:nodes},(_,i)=>Array.from({length:nodes},(_,j)=>i===j?0:Infinity));for(const [a,b] of undirected)d[a][b]=d[b][a]=1;
  for(let k=0;k<nodes;k++)for(let i=0;i<nodes;i++)for(let j=0;j<nodes;j++)d[i][j]=Math.min(d[i][j],d[i][k]+d[k][j]);same('he:monk-and-the-islands',{nodes,edges:undirected},Number.isFinite(d[0][nodes-1])?d[0][nodes-1]:-1);
 }
 // Fixed edge cases target operations and structural conditions not covered above.
 same('lc:394',{text:'2[ab]3[c2[d]]'},'ababcddcddcdd');
 same('lc:150',{tokens:['-9','2','/']},-4);
 same('lc:211',{operations:[['add','a'],['add','ab'],['search','.'],['search','..'],['search','...']]},[true,true,false]);
 same('lc:212',{board:[['a','a']],words:['a','aa','aaa']},['a','aa']);
 same('lc:105',{preorder:[2,1,3],inorder:[1,2,3]},[2,1,3]);
 same('lc:230',{tree:[2,1,3],k:3},3);
 same('lc:110',{tree:[]},true);same('lc:543',{tree:[]},0);
 same('lc:130',{board:[['O']]},[['O']]);same('lc:994',{grid:[[0]]},0);
 same('lc:417',{heights:[]},[]);same('lc:210',{courses:0,prerequisites:[]},[]);
 same('lc:295',{operations:[['add',-1],['add',0],['median']]},[-0.5]);
 same('lc:91',{text:'101'},1);same('lc:91',{text:'0'},0);
 same('lc:62',{rows:1,columns:20},1);same('lc:518',{coins:[3,7],amount:0},1);
 same('lc:494',{values:[],target:0},1);same('lc:678',{text:''},true);
 same('lc:621',{tasks:[],cooldown:10},0);same('lc:973',{points:[[1,1]],k:0},[]);
 same('lc:36',{board:Array(9).fill('.........')},true);
 return checks;
}
