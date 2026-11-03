import { useEffect, useRef } from "react";
import { Check, Plus, X } from "@phosphor-icons/react";
import { QuestionContent } from "./QuestionContent.jsx";

export function CatalogDetails({ question, added, full, add, close }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return <dialog ref={ref} className="modal catalog-detail" aria-labelledby="catalog-detail-title"
    onCancel={close} onClick={(event) => { if(event.target===event.currentTarget)close(); }}>
    <div className="modal-heading">
      <span className="catalog-eyebrow">Question preview</span>
      <button className="icon-button" onClick={close} aria-label="Close question details"><X size={22}/></button>
    </div>
    <h2 id="catalog-detail-title">{question.title}</h2>
    <div className="catalog-tags"><span className={`difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span><span>{question.topic}</span></div>
    <QuestionContent id={question.id} version={question.content_version}/>
    {full&&!added&&<p className="catalog-hint" role="status">Your library is full. Remove a personal question before adding more.</p>}
    <div className="form-actions catalog-detail-actions">
      <button className="secondary-button" onClick={close}>Close preview</button>
      <button className="primary-button" disabled={added||full} onClick={()=>add([question])}>
        {added?<Check size={17}/>:<Plus size={17}/>} {added?"Added":"Add to My Questions"}
      </button>
    </div>
  </dialog>;
}
