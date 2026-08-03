import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'

import ProgressBar from '/src/components/ProgressBar'
import TopAlert from "/src/components/TopAlert"
import Pagination from '/src/components/Pagination'

import { useAuthContext } from '/src/contexts/auth'
import { getUsage } from '/src/api/me'
import { getUserLimits } from '/src/api/rules'
import { submitArgument, fetchCaseEvidence, fetchCase } from '/src/api/cases'
import { LIMITS } from '/src/api/limits'

import './NewArgument.css'

const TAGS = [
    { value: 'PROSECUTION', label: 'Prosecution', tag:'prosecution'  },
    { value: 'DEFENSE', label: 'Defense', tag:'defense' },
]

function NewArgument({ onSubmitted }){
    const { id } = useParams()
    const { isAuthenticated, isAuthLoading } = useAuthContext();

    // loading vars
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [loadingEvidence, setLoadingEvidence] = useState(false)

    // submission vars
    const [tag, setTag] = useState(null);
    const [argument, setArgument] = useState('');
    const [citedEvidenceIds, setCitedEvidenceIds] = useState([])
    const [citedCases, setCitedCases] = useState([]) // [{ case_id, judge_ruling }]
    const [caseInput, setCaseInput] = useState('')

    const [userLimits, setUserLimits] = useState({arguments: 0})
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })
    const [evidenceHistory, setEvidenceHistory] = useState({limit: 10, page: 1, last_page: 1, entries: []})
    const [paneOpen, setPaneOpen] = useState(false)
    
    // err messages
    const [alertMsg, setAlertMsg] = useState('')
    const [citeError, setCiteError] = useState('')

    const refreshUsage = async () => {
        const res = await getUsage()
        if (res.ok) setUsage(await res.json())
    }

    useEffect(() => {
        async function fetchData(){
            const res = await Promise.all([
                getUserLimits(),
                getUsage(),
            ])
            if (res[0].ok) setUserLimits(await res[0].json())
            if (res[1].ok) setUsage(await res[1].json())
            setLoading(false)
        }
        fetchData();
    }, [id]);

    useEffect(() => {
        (async () => {
            if (loading) return
            setLoadingEvidence(true);
            const queryParams = {
                limit: evidenceHistory.limit,
                page: evidenceHistory.page,
            }

            const res = await fetchCaseEvidence(id, queryParams)
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
    }, [loading, id, evidenceHistory.limit, evidenceHistory.page]);

    const toggleEvidence = (evidenceId) => {
        setCitedEvidenceIds((prev) =>
            prev.includes(evidenceId) ? prev.filter((e) => e !== evidenceId) : [...prev, evidenceId]
        )
    }

    const removeEvidence = (evidenceId) => {
        setCitedEvidenceIds((prev) => prev.filter((e) => e !== evidenceId))
    }

    const handleCiteCase = async () => {
        const num = caseInput.trim()
        if (!num) return
        if (citedCases.some((c) => c.case_id === num)) {
            setCiteError(`Case #${num} is already cited.`)
            return
        }
        const res = await fetchCase(num)
        if (!res.ok) {
            setCiteError(`Case #${num} not found.`)
            return
        }
        const found = await res.json()
        setCitedCases((prev) => [...prev, found])
        setCaseInput('')
        setCiteError('')
    }

    const removeCase = (caseNum) => {
        setCitedCases((prev) => prev.filter((c) => c.case_id !== caseNum))
    }

    const submitHandler = async (e) => {
        e.preventDefault();
        if (alertMsg) setAlertMsg('')

        if (!tag) {
            setAlertMsg('Select prosecution or defense before submitting.')
            return
        }
        if (citedEvidenceIds.length + citedCases.length > 5) {
            setAlertMsg('Arguments can cite at most 5 items total.')
            return
        }

        setSubmitting(true)

        const res = await submitArgument({
            id,
            content: argument,
            argument_tag: tag,
            evidence_ids: citedEvidenceIds,
            case_ids: citedCases.map((c) => c.case_id),
        })
        const data = await res.json()

        if (res.ok){
            setArgument('')
            setTag(null)
            setCitedEvidenceIds([])
            setCitedCases([])
            await refreshUsage()
            if (onSubmitted) onSubmitted()
        }
        else {
            setAlertMsg(data.error)
        }
        setSubmitting(false)
    }

    const limitReached = usage.arguments >= userLimits.arguments;
    const submitDisabled = loading || limitReached || !isAuthenticated || submitting;

    const charCount = argument.length;
    const charLimit = LIMITS.ARGUMENT_MAX_LEN;
    const isOverWarning = charCount >= charLimit * 0.9 && charCount < charLimit;
    const isAtLimit = charCount >= charLimit;
    const charStateClass = isAtLimit ? ' is-error' : isOverWarning ? ' is-warning' : '';

    if (loading || isAuthLoading){
        return (
            <div className='main-content minimal'>
                <h1>Loading argument form...</h1>
            </div>
        )
    }
    
    return (
        <div className='NewArgument'>
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
                                maxLength={charLimit}
                                onChange={(e) => setArgument(e.target.value)}
                                placeholder="Argue the case…"
                                rows={5}
                                required
                            />
                            <small className="char-limit">{charCount}/{charLimit}</small>

                            <button type="button" className="cite-toggle" onClick={() => setPaneOpen(true)}>
                                + cite evidence
                            </button>

                            <div className="case-cite-row">
                                <input
                                    type="text"
                                    value={caseInput}
                                    onChange={(e) => setCaseInput(e.target.value)}
                                    placeholder="case #"
                                />
                                <button type="button" onClick={handleCiteCase}>+ case citation</button>
                            </div>

                            {citeError && (
                                <div className="alert alert-error">
                                    <span className="alert-icon">!</span>
                                    <span>{citeError}</span>
                                </div>
                            )}

                            {(citedEvidenceIds.length > 0 || citedCases.length > 0) && (
                                <div className="citations-container">
                                    {citedEvidenceIds.map((evidenceId) => {
                                        const ev = evidenceHistory.entries.find((e) => e.evidence_id === evidenceId)
                                        if (!ev) return null
                                        return (
                                            <div className="citation-row" key={`ev-${evidenceId}`}>
                                                <div>
                                                    <div>"{ev.text}"</div>
                                                    <div className="citation-sub">
                                                        Evidence #{evidenceId} — +{ev.up_votes} / -{ev.down_votes}
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => removeEvidence(evidenceId)} className="remove-citation">✖</button>
                                            </div>
                                        )
                                    })}
                                    {citedCases.map((c) => (
                                        <div className="citation-row" key={`case-${c.case_id}`}>
                                            <div>
                                                <div>Case #{c.case_id}</div>
                                                <div className="citation-sub">
                                                    {c.judge_ruling}
                                                </div>
                                            </div>
                                            <button type="button" onClick={() => removeCase(c.case_id)} className="remove-citation">✖</button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <ProgressBar
                                label="Daily argument submissions"
                                value={usage.arguments}
                                limit={userLimits.arguments}
                                limit_message={"You've reached your daily argument limit."}
                            />

                            <button
                                className="submit"
                                type="submit"
                                disabled={submitDisabled || submitting}
                                aria-busy={submitting}
                            >
                                {submitting ? 'Submitting…' : ' Submit Argument'}
                            </button>

                        </form>

                        {alertMsg && (
                            <div className="alert alert-error">
                                <span className="alert-icon">!</span>
                                <span>{alertMsg}</span>
                            </div>
                        )}
                    </div>

                <div className={`pullout-overlay ${paneOpen ? 'open':''}`} onClick={() => setPaneOpen(false)} >
                </div>

                <aside className={`pullout-pane ${paneOpen ? 'open':''}`} onClick={(e) => e.stopPropagation()} >
                    <button type="button" onClick={() => setPaneOpen(false)} aria-label="close pane" className="close-pane">✖</button>
                    <div className="pullout-header">
                        <div>
                            <h2>evidence & cases</h2>
                            <small className="char-limit">select to cite</small>
                        </div>
                    </div>
                    <div className="pullout-list">
                        {loadingEvidence ? (<div className="minimal"><div>Loading evidence...</div></div>) :

                        evidenceHistory.entries.length === 0 ? (
                            <div className="minimal">No evidence submitted yet.</div>
                        ) : (
                            evidenceHistory.entries.map((ev) => (
                                <label className="pullout-item" key={ev.evidence_id}>
                                    <input
                                        type="checkbox"
                                        checked={citedEvidenceIds.includes(ev.evidence_id)}
                                        onChange={() => toggleEvidence(ev.evidence_id)}
                                    />
                                    <div>
                                        <div>"{ev.text}"</div>
                                        <div className="citation-sub">
                                            <div>Evidence #{ev.evidence_id}</div> —
                                            <div>+{ev.up_votes} / -{ev.down_votes}</div>
                                        </div>
                                    </div>
                                </label>
                            ))
                        )}
                    </div>

                    <Pagination history={evidenceHistory} setHistory={setEvidenceHistory} />

                    <button type="button" onClick={() => setPaneOpen(false)}>
                        close pane
                    </button>
                </aside>
            </div>
        </div>

    )
}

export default NewArgument;