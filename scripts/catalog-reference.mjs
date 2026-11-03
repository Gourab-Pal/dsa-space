// Independently written reference implementations for the 50 pilot exercises.
// JSON inputs deliberately use arrays/edge lists instead of language-specific nodes.
export const reference = {
  'lc:1': ({values,target}) => { const seen=new Map(); for(let i=0;i<values.length;i++){if(seen.has(target-values[i]))return [seen.get(target-values[i]),i];seen.set(values[i],i);} return []; },
  'lc:242': ({first,second}) => {const c=new Map(); for(const x of first)c.set(x,(c.get(x)||0)+1);for(const x of second)c.set(x,(c.get(x)||0)-1);return [...c.values()].every(x=>x===0);},
  'lc:238': ({values}) => {const out=Array(values.length).fill(1);let p=1;for(let i=0;i<values.length;i++){out[i]=p;p*=values[i];}p=1;for(let i=values.length-1;i>=0;i--){out[i]*=p;p*=values[i];}return out;},
  'lc:53': ({values}) => {let best=values[0],end=best;for(const n of values.slice(1)){end=Math.max(n,end+n);best=Math.max(best,end);}return best;},
  'lc:56': ({intervals}) => {const out=[];for(const [s,e] of [...intervals].sort((a,b)=>a[0]-b[0])){if(out.length&&s<=out.at(-1)[1])out.at(-1)[1]=Math.max(out.at(-1)[1],e);else out.push([s,e]);}return out;},
  'lc:704': ({values,target}) => {let l=0,r=values.length-1;while(l<=r){const m=l+Math.floor((r-l)/2);if(values[m]===target)return m;if(values[m]<target)l=m+1;else r=m-1;}return -1;},
  'lc:33': ({values,target}) => {let l=0,r=values.length-1;while(l<=r){const m=(l+r)>>1;if(values[m]===target)return m;if(values[l]<=values[m]){if(values[l]<=target&&target<values[m])r=m-1;else l=m+1;}else if(values[m]<target&&target<=values[r])l=m+1;else r=m-1;}return -1;},
  'lc:34': ({values,target}) => {function lower(t){let l=0,r=values.length;while(l<r){const m=(l+r)>>1;if(values[m]<t)l=m+1;else r=m;}return l;}const a=lower(target);return a===values.length||values[a]!==target?[-1,-1]:[a,lower(target+1)-1];},
  'lc:69': ({value}) => {let l=0,r=value;while(l<=r){const m=Math.floor((l+r)/2);if(m*m<=value)l=m+1;else r=m-1;}return r;},
  'lc:125': ({text}) => {let l=0,r=text.length-1;const valid=x=>/[a-z0-9]/i.test(x);while(l<r){if(!valid(text[l])){l++;continue;}if(!valid(text[r])){r--;continue;}if(text[l++].toLowerCase()!==text[r--].toLowerCase())return false;}return true;},
  'lc:167': ({values,target}) => {let l=0,r=values.length-1;while(l<r){const s=values[l]+values[r];if(s===target)return [l+1,r+1];if(s<target)l++;else r--;}return [];},
  'lc:11': ({heights}) => {let l=0,r=heights.length-1,b=0;while(l<r){b=Math.max(b,(r-l)*Math.min(heights[l],heights[r]));if(heights[l]<=heights[r])l++;else r--;}return b;},
  'lc:283': ({values}) => {const out=[...values];let w=0;for(const n of values)if(n!==0)out[w++]=n;while(w<out.length)out[w++]=0;return out;},
  'lc:3': ({text}) => {const last=new Map();let l=0,b=0;for(let r=0;r<text.length;r++){if(last.has(text[r]))l=Math.max(l,last.get(text[r])+1);last.set(text[r],r);b=Math.max(b,r-l+1);}return b;},
  'lc:209': ({values,target}) => {let l=0,s=0,b=Infinity;for(let r=0;r<values.length;r++){s+=values[r];while(s>=target){b=Math.min(b,r-l+1);s-=values[l++];}}return Number.isFinite(b)?b:0;},
  'lc:239': ({values,k}) => {const deque=[],out=[];let head=0;for(let i=0;i<values.length;i++){while(head<deque.length&&deque[head]<=i-k)head++;while(head<deque.length&&values[deque.at(-1)]<=values[i])deque.pop();deque.push(i);if(head>k){deque.splice(0,head);head=0;}if(i>=k-1)out.push(values[deque[head]]);}return out;},
  'lc:20': ({text}) => {const s=[],pairs={')':'(',']':'[','}':'{'};for(const c of text){if('([{'.includes(c))s.push(c);else if(s.pop()!==pairs[c])return false;}return s.length===0;},
  'lc:155': ({operations}) => {const s=[],out=[];for(const [op,value] of operations){if(op==='push')s.push([value,Math.min(value,s.at(-1)?.[1]??Infinity)]);else if(op==='pop')s.pop();else if(op==='top')out.push(s.at(-1)[0]);else out.push(s.at(-1)[1]);}return out;},
  'lc:739': ({temperatures}) => {const out=temperatures.map(()=>0),s=[];for(let i=0;i<temperatures.length;i++){while(s.length&&temperatures[s.at(-1)]<temperatures[i]){const j=s.pop();out[j]=i-j;}s.push(i);}return out;},
  'lc:206': ({values}) => {let head=null;for(let i=values.length-1;i>=0;i--)head={value:values[i],next:head};let prev=null;while(head){const next=head.next;head.next=prev;prev=head;head=next;}const out=[];while(prev){out.push(prev.value);prev=prev.next;}return out;},
  'lc:141': ({values,tailNext}) => {const nodes=values.map(value=>({value,next:null}));for(let i=0;i<nodes.length-1;i++)nodes[i].next=nodes[i+1];if(nodes.length)nodes.at(-1).next=tailNext<0?null:nodes[tailNext];let slow=nodes[0]||null,fast=slow;while(fast&&fast.next){slow=slow.next;fast=fast.next.next;if(slow===fast)return true;}return false;},
  'lc:21': ({first,second}) => {const out=[];let i=0,j=0;while(i<first.length&&j<second.length)out.push(first[i]<=second[j]?first[i++]:second[j++]);return out.concat(first.slice(i),second.slice(j));},
  'lc:876': ({values}) => values.slice(Math.floor(values.length/2)),
  'lc:104': ({tree}) => {const root=buildTree(tree),stack=root?[[root,1]]:[];let best=0;while(stack.length){const [n,d]=stack.pop();best=Math.max(best,d);if(n.left)stack.push([n.left,d+1]);if(n.right)stack.push([n.right,d+1]);}return best;},
  'lc:102': ({tree}) => {const root=buildTree(tree);if(!root)return [];const q=[root],out=[];let h=0;while(h<q.length){const end=q.length,level=[];while(h<end){const n=q[h++];level.push(n.value);if(n.left)q.push(n.left);if(n.right)q.push(n.right);}out.push(level);}return out;},
  'lc:98': ({tree}) => {const root=buildTree(tree),stack=root?[[root,-Infinity,Infinity]]:[];while(stack.length){const [n,lo,hi]=stack.pop();if(!(lo<n.value&&n.value<hi))return false;if(n.left)stack.push([n.left,lo,n.value]);if(n.right)stack.push([n.right,n.value,hi]);}return true;},
  'lc:235': ({tree,first,second}) => {let n=buildTree(tree);while(n){if(first<n.value&&second<n.value)n=n.left;else if(first>n.value&&second>n.value)n=n.right;else return n.value;}return null;},
  'lc:200': ({grid}) => {if(!grid.length)return 0;const a=grid.map(r=>[...r]);let count=0;for(let r=0;r<a.length;r++)for(let c=0;c<a[0].length;c++)if(a[r][c]===1){count++;a[r][c]=0;const stack=[[r,c]];while(stack.length){const [x,y]=stack.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nr=x+dx,nc=y+dy;if(nr>=0&&nc>=0&&nr<a.length&&nc<a[0].length&&a[nr][nc]===1){a[nr][nc]=0;stack.push([nr,nc]);}}}}return count;},
  'lc:133': ({adjacency}) => {if(!adjacency.length)return [];const nodes=adjacency.map((_,i)=>({label:i+1,neighbors:[]}));adjacency.forEach((row,i)=>{nodes[i].neighbors=row.map(x=>nodes[x-1]);});const copies=new Map();function clone(n){if(copies.has(n))return copies.get(n);const c={label:n.label,neighbors:[]};copies.set(n,c);c.neighbors=n.neighbors.map(clone);return c;}clone(nodes[0]);for(const [original,copy] of copies){if(original===copy||copy.neighbors.some(n=>nodes.includes(n)))throw new Error('Clone leaked original objects');}return [...copies.values()].sort((a,b)=>a.label-b.label).map(n=>n.neighbors.map(x=>x.label));},
  'lc:207': ({courses,prerequisites}) => {const next=Array.from({length:courses},()=>[]),degree=Array(courses).fill(0);for(const [a,b] of prerequisites){next[b].push(a);degree[a]++;}const q=[];degree.forEach((d,i)=>{if(!d)q.push(i);});let h=0;while(h<q.length){for(const v of next[q[h++]])if(--degree[v]===0)q.push(v);}return h===courses;},
  'lc:1091': ({grid}) => {const n=grid.length;if(grid[0][0]||grid[n-1][n-1])return -1;const seen=grid.map(r=>r.map(()=>false)),q=[[0,0,1]];seen[0][0]=true;for(let h=0;h<q.length;h++){const [r,c,d]=q[h];if(r===n-1&&c===n-1)return d;for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const a=r+dr,b=c+dc;if((dr||dc)&&a>=0&&b>=0&&a<n&&b<n&&!grid[a][b]&&!seen[a][b]){seen[a][b]=true;q.push([a,b,d+1]);}}}return -1;},
  'lc:684': ({edges}) => {const p=Array.from({length:edges.length+1},(_,i)=>i),size=p.map(()=>1);function root(x){while(p[x]!==x){p[x]=p[p[x]];x=p[x];}return x;}for(const [a,b] of edges){let x=root(a),y=root(b);if(x===y)return [a,b];if(size[x]<size[y])[x,y]=[y,x];p[y]=x;size[x]+=size[y];}return [];},
  'lc:347': ({values,k}) => {const counts=new Map();for(const x of values)counts.set(x,(counts.get(x)||0)+1);const heap=new Heap((a,b)=>a[1]-b[1]||b[0]-a[0]);for(const pair of counts){heap.push(pair);if(heap.size>k)heap.pop();}const out=[];while(heap.size)out.push(heap.pop());return out.sort((a,b)=>b[1]-a[1]||a[0]-b[0]).map(x=>x[0]);},
  'lc:215': ({values,k}) => {const heap=new Heap((a,b)=>a-b);for(const x of values){heap.push(x);if(heap.size>k)heap.pop();}return heap.pop();},
  'lc:23': ({lists}) => {const heap=new Heap((a,b)=>a.value-b.value),out=[];lists.forEach((list,i)=>{if(list.length)heap.push({value:list[0],list:i,index:0});});while(heap.size){const x=heap.pop();out.push(x.value);if(x.index+1<lists[x.list].length)heap.push({value:lists[x.list][x.index+1],list:x.list,index:x.index+1});}return out;},
  'lc:208': ({operations}) => {const root={},out=[];for(const [op,word] of operations){let n=root;for(const c of word){if(!n[c]){if(op==='insert')n[c]={};else {n=null;break;}}n=n[c];}if(op==='insert')n.end=true;else out.push(Boolean(n&&(op==='startsWith'||n.end)));}return out;},
  'lc:78': ({values}) => {const out=[[]];for(const x of values){const old=out.length;for(let i=0;i<old;i++)out.push([...out[i],x]);}return out;},
  'lc:46': ({values}) => {const out=[],path=[],used=values.map(()=>false);function visit(){if(path.length===values.length){out.push([...path]);return;}for(let i=0;i<values.length;i++)if(!used[i]){used[i]=true;path.push(values[i]);visit();path.pop();used[i]=false;}}visit();return out;},
  'lc:39': ({candidates,target}) => {const out=[],path=[],a=[...candidates].sort((x,y)=>x-y);function visit(start,left){if(!left){out.push([...path]);return;}for(let i=start;i<a.length&&a[i]<=left;i++){path.push(a[i]);visit(i,left-a[i]);path.pop();}}visit(0,target);return out;},
  'lc:70': ({steps}) => {let a=1,b=1;for(let i=2;i<=steps;i++)[a,b]=[b,a+b];return b;},
  'lc:322': ({coins,amount}) => {const dp=Array(amount+1).fill(Infinity);dp[0]=0;for(let s=1;s<=amount;s++)for(const c of coins)if(c<=s)dp[s]=Math.min(dp[s],1+dp[s-c]);return Number.isFinite(dp[amount])?dp[amount]:-1;},
  'lc:300': ({values}) => {const tails=[];for(const x of values){let l=0,r=tails.length;while(l<r){const m=(l+r)>>1;if(tails[m]<x)l=m+1;else r=m;}tails[l]=x;}return tails.length;},
  'lc:1143': ({first,second}) => {let prev=Array(second.length+1).fill(0);for(const a of first){const row=[0];for(let j=1;j<=second.length;j++)row[j]=a===second[j-1]?prev[j-1]+1:Math.max(prev[j],row[j-1]);prev=row;}return prev[second.length];},
  'lc:139': ({text,words}) => {const dp=Array(text.length+1).fill(false);dp[0]=true;for(let i=1;i<=text.length;i++)for(const w of words)if(w.length<=i&&dp[i-w.length]&&text.slice(i-w.length,i)===w){dp[i]=true;break;}return dp[text.length];},
  'lc:55': ({jumps}) => {let far=0;for(let i=0;i<jumps.length;i++){if(i>far)return false;far=Math.max(far,i+jumps[i]);}return true;},
  'lc:435': ({intervals}) => {let end=-Infinity,kept=0;for(const [s,e] of [...intervals].sort((a,b)=>a[1]-b[1]))if(s>=end){end=e;kept++;}return intervals.length-kept;},
  'lc:191': ({value}) => {let n=value>>>0,c=0;while(n){n=(n&(n-1))>>>0;c++;}return c;},
  'lc:303': ({values,queries}) => {const p=[0];for(const x of values)p.push(p.at(-1)+x);return queries.map(([l,r])=>p[r+1]-p[l]);},
  'lc:232': ({operations}) => {const input=[],output=[],answers=[];function move(){if(!output.length)while(input.length)output.push(input.pop());}for(const [op,value] of operations){if(op==='push')input.push(value);else if(op==='empty')answers.push(!input.length&&!output.length);else {move();answers.push(op==='peek'?output.at(-1):output.pop());}}return answers;},
  'cses:1648': ({values,operations}) => {const a=[...values],bit=Array(a.length+1).fill(0),out=[];function add(i,d){for(i++;i<bit.length;i+=i&-i)bit[i]+=d;}function prefix(i){let s=0;for(;i>0;i-=i&-i)s+=bit[i];return s;}a.forEach((x,i)=>add(i,x));for(const [op,x,y] of operations){if(op==='set'){add(x,y-a[x]);a[x]=y;}else out.push(prefix(y+1)-prefix(x));}return out;},
};

function buildTree(values){
  if(!values.length||values[0]===null)return null;
  const root={value:values[0]},q=[root];let pos=1;
  for(let h=0;h<q.length&&pos<values.length;h++)for(const side of ['left','right']){
    const value=values[pos++];if(value!==undefined&&value!==null){q[h][side]={value};q.push(q[h][side]);}
  }
  return root;
}
class Heap{
  constructor(compare){this.a=[];this.compare=compare;}
  get size(){return this.a.length;}
  push(value){const a=this.a;let i=a.push(value)-1;while(i){const p=(i-1)>>1;if(this.compare(a[p],a[i])<=0)break;[a[p],a[i]]=[a[i],a[p]];i=p;}}
  pop(){const a=this.a;if(!a.length)return undefined;const top=a[0],last=a.pop();if(a.length){a[0]=last;let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&this.compare(a[c+1],a[c])<0)c++;if(this.compare(a[i],a[c])<=0)break;[a[i],a[c]]=[a[c],a[i]];i=c;}}return top;}
}
