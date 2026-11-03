// Local admin tool. Never import this module into frontend code.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { validateCatalog } from './catalog-validate.mjs';

export function importBatches(catalog, size=10) {
  const {questions,...manifest}=catalog;
  const batches=[];
  for(let i=0;i<questions.length;i+=size)batches.push({manifest,questions:questions.slice(i,i+size)});
  return batches;
}
export function batchSql(batch){
  return `-- Admin import: safe to rerun the same batch. Does not publish yet.\nbegin;\nselect public.import_catalog_batch(${sqlJson(batch.manifest,'manifest')},\n${sqlJson(batch.questions,'questions')});\ncommit;\n`;
}
function sqlJson(value,label){
  const json=JSON.stringify(value);let tag=`$catalog_${label}$`;
  while(json.includes(tag))tag=tag.slice(0,-1)+'_$';
  return tag+json+tag+'::jsonb';
}
export function publishSql(id){
  if(!/^[a-z0-9-]+$/.test(id))throw new Error('Invalid release ID');
  return `-- Publish only after all batches succeed. Existing private work is preserved.\nbegin;\nselect public.publish_catalog_release('${id}');\ncommit;\n`;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
  const args=process.argv.slice(2),mode=args[0]||'--check';
  if(!['--check','--sql','--apply','--export'].includes(mode))throw new Error('Use --check, --sql, --apply or --export');
  if(mode==='--export'){
    const client=adminClient();
    const tables=['catalog_sources','catalog_questions','catalog_question_families','catalog_question_content','catalog_question_approaches','catalog_question_links','catalog_collections','catalog_collection_items','catalog_releases','catalog_release_items'];
    const output={exported_at:new Date().toISOString(),tables:{}};
    const keys={catalog_question_content:['question_id','version'],catalog_question_approaches:['question_id','content_version','id'],catalog_question_links:['question_id','content_version','id'],catalog_release_items:['release_id','question_id'],catalog_collection_items:['collection_id','question_id'],catalog_question_families:['question_id']};
    for(const table of tables){
      const rows=[];
      for(let start=0;;start+=500){
        let query=client.from(table).select('*');
        for(const key of keys[table]||['id'])query=query.order(key);
        const {data,error}=await query.range(start,start+499);
        if(error)throw new Error(`Export failed for ${table}: ${error.code||'database error'}`);
        rows.push(...data);if(data.length<500)break;
      }
      output.tables[table]=rows;
    }
    const path=resolve(args[1]||'catalog-backup.json');
    await writeFile(path,JSON.stringify(output,null,2)+'\n');
    console.log('Shared catalog exported to '+path+'. Personal questions were not exported.');
  }else{
    const catalog=JSON.parse(await readFile(resolve(root,args[1]||'catalog/interview-pilot.json'),'utf8'));
    validateCatalog(catalog);
    console.log(`Validated ${catalog.questions.length} complete questions.`);
    if(mode==='--sql'){
      const dir=resolve(root,'catalog-import-sql');await mkdir(dir,{recursive:true});
      const batches=importBatches(catalog);
      for(let i=0;i<batches.length;i++)await writeFile(resolve(dir,`${String(i+1).padStart(2,'0')}-batch.sql`),batchSql(batches[i]));
      await writeFile(resolve(dir,`${String(batches.length+1).padStart(2,'0')}-publish.sql`),publishSql(catalog.release_id));
      console.log('Bounded SQL files written to '+dir+'. Run them in numeric order after schema.sql.');
    }
    if(mode==='--apply'){
      const client=adminClient();
      for(const batch of importBatches(catalog)){
        const {data,error}=await client.rpc('import_catalog_batch',{p_manifest:batch.manifest,p_questions:batch.questions});
        if(error)throw new Error(`Import failed (${error.code||'database error'}). Fix the data and rerun; completed identical batches are safe.`);
        console.log(`Imported ${data.imported}/${data.expected}`);
      }
      const {data,error}=await client.rpc('publish_catalog_release',{p_release_id:catalog.release_id});
      if(error)throw new Error(`Publication failed (${error.code||'database error'}). Previous catalog remains active.`);
      console.log(`Published ${data.questions} questions.`);
    }
  }
}
function adminClient(){
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
  if(!url||!key)throw new Error('Set local SUPABASE_URL and SUPABASE_SECRET_KEY. Never use VITE_ variables for the server secret.');
  return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
