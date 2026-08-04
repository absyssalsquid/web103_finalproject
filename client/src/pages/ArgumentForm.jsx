import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

import ProgressBar from '/src/components/ProgressBar'
import TopAlert from "/src/components/TopAlert"
import Pagination from '/src/components/Pagination'
import ToastMessage from "/src/components/ToastMessage"

import { useAuthContext } from '/src/contexts/auth'
import { getUsage } from '/src/api/me'
import { getUserLimits, getLengthLimits } from '/src/api/rules'
import { submitArgument, fetchCaseEvidence, fetchCase, getArgument } from '/src/api/cases'

import './ArgumentForm.css'
import { editArgument } from '../api/cases'

const TAGS = [
    { value: 'PROSECUTION', label: 'Prosecution', tag:'prosecution'  },
    { value: 'DEFENSE', label: 'Defense', tag:'defense' },
]

function ArgumentForm(){
    const routeParams = useParams()

    const [case_id, setCaseID] = useState(routeParams.case_id)
    const [arg_id, setArgID] = useState(routeParams.arg_id)
    const [forEdit, setEdit] = useState(arg_id ? true : false)
    const [isFetchArgError, setIsFetchArgError] = useState(false)
    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null}) // key=Date.now()

    const { isAuthenticated, user, isAuthLoading } = useAuthContext();
    
    const navigate = useNavigate()

    // loading vars
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [loadingEvidence, setLoadingEvidence] = useState(false)
    const [citingCase, setCitingCase] = useState(false)
    

    // submission vars
    const [fetchedArg, setFetchedArg] = useState({})
    const [tag, setTag] = useState(null);
    const [argument, setArgument] = useState('');
    const [citedEvidenceData, setCitedEvidenceData] = useState({}) // full params of citation for rendering, indexed by evidence_id
    const [citedCaseData, setCitedCaseData] = useState({}) // full params of citation for rendering, indexed by case_id
    const [caseInput, setCaseInput] = useState('')

    const [userLimits, setUserLimits] = useState({arguments: 0})
    const [lengthLimits, setLengthLimits] = useState({})
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })

    const [evidenceHistory, setEvidenceHistory] = useState({limit: 20, page: 1, last_page: 1, entries: []})
    const [paneOpen, setPaneOpen] = useState(false)
    
    // err messages
    const [citeError, setCiteError] = useState('')

    // const refreshUsage = async () => {
    //     const res = await getUsage()
    //     if (res.ok) setUsage(await res.json())
    // }

    useEffect(() => {
        async function fetchData(){
            const res = await Promise.all([
                getUserLimits(),
                getUsage(),
                getLengthLimits(),
            ])
            if (res[0].ok) setUserLimits(await res[0].json())
            if (res[1].ok) setUsage(await res[1].json())
            if (res[2].ok) setLengthLimits(await res[2].json())

            // populate form from fetch for edit
            if (arg_id) {
                const arg_res = await getArgument(arg_id)
                const arg_data = await arg_res.json()

                if (arg_res.ok){
                    console.log(arg_data)
                    setTag(arg_data.argument_tag)
                    setArgument(arg_data.text)
                    setCaseID(arg_data.case_id)
                    setEdit(true)
                    setFetchedArg(arg_data)

                    const ev_cache = Object.fromEntries(arg_data.evidence_citations_data.map((ev) => [ev.evidence_id, ev]))
                    setCitedEvidenceData(ev_cache)

                    const case_cache = Object.fromEntries(arg_data.case_citations_data.map((c) => [c.case_id, c]))
                    setCitedCaseData(case_cache)

                } else{
                    setIsFetchArgError(true)
                    setArgID(null)
                }
            }
            setLoading(false)
        }
        fetchData();
    }, []);

    useEffect(() => {
        if (loading) return

        (async () => {
            setLoadingEvidence(true);
            const queryParams = {
                limit: evidenceHistory.limit,
                page: evidenceHistory.page,
            }

            const res = await fetchCaseEvidence(case_id, queryParams)
            const data = await res.json()
            if (res.ok){
                setEvidenceHistory((prev)=>({
                    ...prev,
                    last_page: data.last_page,
                    entries: data.entries
                }))
            }
            setLoadingEvidence(false);
        })();
    }, [loading, case_id, arg_id, evidenceHistory.limit, evidenceHistory.page]);

    const toggleEvidence = (evidenceId) => {
        // cache or uncache from citedEvidenceData
        const cache = {...citedEvidenceData}
        if (evidenceId in citedEvidenceData){
            delete cache[evidenceId]
        } else{
            const entry = evidenceHistory.entries.filter((e)=> e.evidence_id == evidenceId)
            cache[evidenceId] = entry[0]
        }
        setCitedEvidenceData(cache)
    }

    const removeEvidence = (evidenceId) => {
        const cache = {...citedEvidenceData}
        delete cache[evidenceId]
        setCitedEvidenceData(cache)
    }

    const handleCiteCase = async () => {
        const num = caseInput.trim()
        if (!num) return
        const num2 = Number(num)
        if (!Number.isSafeInteger(num2) || num2 < 1) {
            setCiteError(`Invalid case number.`)
            return
        }
        
        if (num in citedCaseData) {
            setCiteError(`Case #${num} is already cited.`)
            return
        }

        setCitingCase(true)

        const res = await fetchCase(num)
        const data = await res.json()

        // if (data.phase !== 'CLOSED'){
        //     setCiteError(`Case #${num} has not concluded yet.`)
        //     return
        // }

        if (!res.ok) {
            setCiteError(`Case #${num} not found.`)
            setCitingCase(false)
            return
        }
        setCitedCaseData((prev)=> ({...prev, [data.case_id]: data}))

        setCaseInput('')
        setCiteError('')
        setCitingCase(false)
    }

    const removeCase = (caseNum) => {
        const cache = {...citedCaseData}
        console.log(cache)
        delete cache[caseNum]
        setCitedCaseData(cache)
    }

    const submitHandler = async (e) => {
        e.preventDefault();

        if (!tag) {
            setToastMsg({message: 'Select prosecution or defense before submitting.', type: 'error', key: Date.now()})
            return
        }
        if (Object.keys(citedEvidenceData).length + Object.keys(citedCaseData).length > 5) {
            setToastMsg({message: 'Arguments can cite at most 5 items total.', type: 'error', key: Date.now()})
            return
        }

        setSubmitting(true)

        const fn = forEdit ? editArgument : submitArgument
        const res = await fn({
            case_id,
            arg_id,
            text: argument,
            argument_tag: tag,
            evidence_citations: Object.keys(citedEvidenceData),
            case_citations: Object.keys(citedCaseData),
            for_edit: forEdit
        })
        const data = await res.json()

        if (res.ok){
            setToastMsg({message: forEdit ? "Argument saved." : "Argument received.", type: 'success', key: Date.now()})
            setTimeout(() => navigate(`/cases/${case_id}/arguments`), 1700);
        }
        else {
            setToastMsg({message: data.error, type: 'error', key: Date.now()})
            setSubmitting(false)
        }
    }

    const limitReached = usage.arguments >= userLimits.arguments;
    const submitDisabled = loading || limitReached || !isAuthenticated || submitting;

    const charCount = argument.length;
    const charLimit = lengthLimits.argument_max;
    const isOverWarning = charCount >= charLimit * 0.9 && charCount < charLimit;
    const isAtLimit = charCount >= charLimit;
    const charStateClass = isAtLimit ? ' is-error' : isOverWarning ? ' is-warning' : '';

    if (loading || isAuthLoading){
        return (
            <div className='main-content minimal'>
                <h1>Loading argument form...</h1>
                <div className='loader'></div>
            </div>
        )
    }

    if (isFetchArgError){
        return (
            <div className='main-content minimal'>
                <h1>Error fetching argument.</h1>
            </div>
        )
    }

    if (arg_id && isAuthenticated && user.user_id!=fetchedArg.user_id){
        return (
            <div className='main-content minimal'>
                <h1>This is not your argument.</h1>
            </div>
        )
    }
    
    return (
        <div className='ArgumentForm'>
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>
            
            {(!isAuthenticated) &&
                <TopAlert message={(<><Link to={"/sign-in"}>Sign in</Link> to submit an argument</>)} />
            }

            <div className='main-content'>

                <div className="header">
                    <div className="header-row">
                        <h2>Present Your Argument</h2>
                        <p>Make your case!</p>
                    </div>
                </div>

                <div className="card">
                        <form onSubmit={submitHandler} className="form">
                            <div className="tag-toggle">
                                {TAGS.map((t) => (
                                    <label key={t.value} className="tag-label">
                                        <input
                                            type="radio"
                                            name="argument-tag"
                                            value={t.value}
                                            checked={tag === t.value}
                                            onChange={() => setTag(t.value)}
                                            required
                                        />
                                        <span className={`tag-btn ${t.tag}`}>{t.label}</span>
                                    </label>
                                ))}
                            </div>

                            <label htmlFor="argument" className="label">Argument</label>
                            <textarea
                                id="argument"
                                className={`textarea${charStateClass}`}
                                value={argument}
                                minLength={lengthLimits.argument_min}
                                maxLength={lengthLimits.argument_max}
                                onChange={(e) => setArgument(e.target.value)}
                                placeholder="Argue the case…"
                                rows={5}
                                required
                            />
                            <small className="char-limit">{charCount}/{lengthLimits.argument_max}</small>

                            <button type="button" className="cite-toggle" onClick={() => setPaneOpen(true)}>
                                + cite evidence
                            </button>

                            {/* ----------------------------------------- CASE CITATION ROW --------------------------------------- */}
                            <div className="case-cite-row">
                                <input
                                    type="text"
                                    value={caseInput}
                                    onChange={(e) => {setCaseInput(e.target.value); setCiteError('')}}
                                    placeholder="case #"
                                />
                                <button type="button" onClick={handleCiteCase} disabled={citingCase}>+ case citation</button>
                            </div>

                            {citeError && (
                                <div className="alert alert-error">
                                    <span className="alert-icon">!</span>
                                    <span>{citeError}</span>
                                </div>
                            )}

                            {/* ----------------------------------------- EVIDENCE CITATIONS --------------------------------------- */}

                            {(Object.keys(citedEvidenceData).length > 0) && (
                                <>
                                    <label htmlFor="ev-citations" className="label">Evidence citations</label>

                                    <div className="citations-container">
                                        { Object.entries(citedEvidenceData).map(([ev_id, ev])=>(
                                            <div className="citation-row" key={`ev-${ev_id}`}>
                                                <div>
                                                    <div>"{ev.text}"</div>
                                                    <div className="citation-sub">
                                                        {ev.username} — #{ev_id} — +{ev.up_votes} / -{ev.down_votes} 
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeEvidence(ev_id)} className="remove-citation">✖</button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                            {/* ----------------------------------------- CASE CITATIONS --------------------------------------- */}
                            {(Object.keys(citedCaseData).length > 0) && (
                                <>
                                    <label htmlFor="case-citations" className="label">Precedent</label>
                                    <div className="citations-container">
                                        { Object.entries(citedCaseData).map(([c_id, c])=>(
                                            <div className="citation-row" key={`case-${c_id}`}>
                                                <div>
                                                    <div>"{c.judge_ruling}"</div>
                                                    <div className="citation-sub">
                                                        case #{c_id} — {c.judge_name}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeCase(c_id)} className="remove-citation">✖</button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {!forEdit &&(
                                <ProgressBar
                                    label="Daily argument submissions"
                                    value={usage.arguments}
                                    limit={userLimits.arguments}
                                    limit_message={"You've reached your daily argument limit."}
                                />
                            )}

                            <button
                                className="submit"
                                type="submit"
                                disabled={(submitDisabled || submitting) && !forEdit}
                                aria-busy={submitting}
                            >
                                {submitting ? 'Submitting…' : (forEdit ? 'Save changes' : 'Submit argument')}
                            </button>

                        </form>
                    </div>



                <div className={`pullout-overlay ${paneOpen ? 'open':''}`} onClick={() => setPaneOpen(false)} >
                </div>

                <aside className={`pullout-pane ${paneOpen ? 'open':''}`} onClick={(e) => e.stopPropagation()} >
                    <button type="button" onClick={() => setPaneOpen(false)} aria-label="close pane" className="close-pane">✖</button>
                    <div className="pullout-header">
                        <div>
                            <h2>case evidence</h2>
                            <small className="char-limit">select to cite</small>
                        </div>
                    </div>
                    <div className="pullout-list">
                        {loadingEvidence ? (
                            <div className="minimal">
                                <div>Loading evidence...</div>
                                <div className='loader'></div>
                            </div>
                        ) :

                        evidenceHistory.entries.length === 0 ? (
                            <div className="minimal">No evidence submitted yet.</div>
                        ) : (
                            evidenceHistory.entries.map((ev) => (
                                <label className="pullout-item" key={ev.evidence_id}>
                                    <input
                                        type="checkbox"
                                        checked={ev.evidence_id in citedEvidenceData }
                                        onChange={() => toggleEvidence(ev.evidence_id)}
                                    />
                                    <div>
                                        <div>"{ev.text}"</div>
                                        <div className="citation-sub">
                                            <div>{ev.username}</div> —
                                            <div>#{ev.evidence_id}</div> —
                                            <div>+{ev.up_votes} / -{ev.down_votes}</div>
                                        </div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>
                    
                    {!loadingEvidence && (<Pagination history={evidenceHistory} setHistory={setEvidenceHistory} />)}

                    <button type="button" onClick={() => setPaneOpen(false)}>
                        close pane
                    </button>
                </aside>
            </div>
        </div>

    )
}

export default ArgumentForm;