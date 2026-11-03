import assert from 'node:assert/strict';
import { reference } from './catalog-reference.mjs';

// The same validation gates SQL export and direct imports. No placeholder rows.
export function validateCatalog(catalog){
  assert.equal(catalog.format_version,1);
  assert.match(catalog.release_id,/^[a-z0-9-]+$/);
  assert.ok(Number.isInteger(catalog.expected_count)&&catalog.expected_count>0&&catalog.expected_count<=6000);
  assert.equal(catalog.questions.length,catalog.expected_count);
  const ids=new Set(),links=new Map(),collections=new Set(catalog.collections.map(c=>c.id));
  let examples=0;
  for(const item of catalog.questions){
    const q=item.question,c=item.content,label=q.id;
    assert.ok(!ids.has(q.id),'Duplicate question '+label);ids.add(q.id);
    assert.ok(Number.isInteger(item.version)&&item.version>0);
    for(const key of ['title','topic','difficulty','url'])assert.ok(typeof q[key]==='string'&&q[key].length>0,`${label}: missing ${key}`);
    assert.ok(['Easy','Medium','Hard'].includes(q.difficulty));
    for(const key of ['description','input_format','output_format','authorship','attribution','verification'])assert.ok(typeof c[key]==='string'&&c[key].trim().length>=5,`${label}: missing ${key}`);
    assert.ok(c.description.length>=80);assert.equal(c.license,'CC-BY-4.0');
    for(const key of ['constraints','prerequisites','hints'])assert.ok(Array.isArray(c[key])&&c[key].length>=(key==='hints'?2:1)&&c[key].every(x=>typeof x==='string'&&x.trim()),`${label}: incomplete ${key}`);
    assert.ok(c.examples.length>=2);assert.ok(reference[label],`Missing reference implementation for ${label}`);
    for(const example of c.examples){
      assert.ok(example.input&&Object.hasOwn(example,'output')&&example.explanation.length>15);
      assert.deepEqual(reference[label](structuredClone(example.input)),example.output,`${label}: example does not match reference`);examples++;
    }
    assert.ok(item.approaches.length>=1);
    const methods=new Set();
    for(const a of item.approaches){
      assert.ok(!methods.has(a.id));methods.add(a.id);
      for(const key of ['id','title','explanation','pseudocode','time_complexity','space_complexity','assumptions'])assert.ok(typeof a[key]==='string'&&a[key].trim().length>0,`${label}: missing approach ${key}`);
    }
    assert.ok(item.links.length>=1);
    for(const l of item.links){
      const url=new URL(l.url);assert.equal(url.protocol,'https:');
      const key=url.hostname.replace(/^www\./,'')+url.pathname.replace(/\/+$/,'');
      assert.ok(!links.has(key)||links.get(key)===label,`Duplicate source URL assigned to different questions: ${l.url}`);links.set(key,label);
    }
    assert.ok(item.collections.length&&item.collections.every(c=>collections.has(c)));
  }
  return {questions:ids.size,examples,sourceLinks:links.size};
}
