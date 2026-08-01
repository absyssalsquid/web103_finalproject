import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import ProgressBar from '/src/components/ProgressBar'
import { useAuthContext } from '/src/contexts/auth'
import { getUsage } from '/src/api/me'
import { getUserLimits } from '/src/api/rules'
import { submitArgument, fetchCaseEvidence, fetchCase } from '/src/api/cases'
import { LIMITS } from '/src/api/limits'

import './NewArgument.css'

const TAGS = [
    { value: 'PROSECUTION', label: 'Prosecution' },
    { value: 'DEFENSE', label: 'Defense' },
]

function NewArgument({ onSubmitted }){
    const { id } = useParams()
    const { isAuthenticated } = useAuthContext();

    const [argument, setArgument] = useState('');
    const [tag, setTag] = useState(null);
    const [userLimits, setUserLimits] = useState({})
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })
    const [limitsLoading, setLimitsLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [alertMsg, setAlertMsg] = useState('')

    const [evidenceList, setEvidenceList] = useState([])
    const [paneOpen, setPaneOpen] = useState(false)
    const [citedEvidenceIds, setCitedEvidenceIds] = useState([])
    const [citedCases, setCitedCases] = useState([]) // [{ case_id, judge_ruling }]
    const [caseInput, setCaseInput] = useState('')
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
                fetchCaseEvidence(id, {})
            ])
            if (res[0].ok) setUserLimits(await res[0].json())
            if (res[1].ok) setUsage(await res[1].json())
            if (res[2].ok) setEvidenceList(await res[2].json())
            setLimitsLoading(false)
        }
        fetchData();
    }, [id]);

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
    const submitDisabled = limitsLoading || limitReached || !isAuthenticated || submitting;

    const remaining = (userLimits.arguments != null && usage.arguments != null)
        ? Math.max(userLimits.arguments - usage.arguments, 0)
        : null;

    const charCount = argument.length;
    const charLimit = LIMITS.ARGUMENT_MAX_LEN;
    const isOverWarning = charCount >= charLimit * 0.9 && charCount < charLimit;
    const isAtLimit = charCount >= charLimit;
    const charStateClass = isAtLimit ? ' is-error' : isOverWarning ? ' is-warning' : '';

    return (
        <div className="argument-composer">
            <div className="argument-composer-card">
                <div className="argument-composer-header">
                    <div className="argument-composer-header-row">
                        <h3>Present Your Argument</h3>
                        <div className="argument-composer-tag-toggle">
                            {TAGS.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    className={`argument-composer-tag-btn${tag === t.value ? ' active' : ''}`}
                                    onClick={() => setTag(t.value)}
                                    aria-pressed={tag === t.value}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <p>Make your case clearly and respectfully.</p>
                </div>

                <form onSubmit={submitHandler} className="argument-composer-form">
                    <label htmlFor="argument" className="argument-composer-label">Argument</label>
                    <textarea
                        id="argument"
                        className={`argument-composer-textarea${charStateClass}`}
                        value={argument}
                        maxLength={charLimit}
                        onChange={(e) => setArgument(e.target.value)}
                        placeholder="Argue the case…"
                        rows={5}
                        required
                    />
                    <div className="argument-composer-footer-row">
                        <span className={`argument-composer-char-count${charStateClass}`}>
                            {charCount}/{charLimit}
                        </span>
                    </div>

                    <div className="argument-composer-citations">
                        <div className="argument-composer-citation-controls">
                            <button type="button" onClick={() => setPaneOpen(true)}>
                                + Cite evidence
                            </button>
                            <div className="argument-composer-case-cite-row">
                                <input
                                    type="text"
                                    value={caseInput}
                                    onChange={(e) => setCaseInput(e.target.value)}
                                    placeholder="Cite case #"
                                />
                                <button type="button" onClick={handleCiteCase}>Cite</button>
                            </div>
                        </div>

                        {citeError && (
                            <div className="argument-composer-alert argument-composer-alert-error">
                                <span className="argument-composer-alert-icon">!</span>
                                <span>{citeError}</span>
                            </div>
                        )}

                        {(citedEvidenceIds.length > 0 || citedCases.length > 0) && (
                            <div className="argument-composer-citations-added">
                                {citedEvidenceIds.map((evidenceId) => {
                                    const ev = evidenceList.find((e) => e.evidence_id === evidenceId)
                                    return (
                                        <div className="citation-card" key={`ev-${evidenceId}`}>
                                            <div>
                                                <span className="citation-id">Evidence #{evidenceId}</span>
                                                <div>{ev?.text}</div>
                                            </div>
                                            <button type="button" onClick={() => removeEvidence(evidenceId)}>remove ×</button>
                                        </div>
                                    )
                                })}
                                {citedCases.map((c) => (
                                    <div className="citation-card" key={`case-${c.case_id}`}>
                                        <div>
                                            <span className="citation-id">Case #{c.case_id}</span>
                                            <div>{c.judge_ruling}</div>
                                        </div>
                                        <button type="button" onClick={() => removeCase(c.case_id)}>remove ×</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="argument-composer-limit-section">
                        <ProgressBar
                            label="Daily argument submissions"
                            value={usage.arguments}
                            limit={userLimits.arguments}
                            limit_message={"You've reached your daily argument limit."}
                        />
                        {remaining !== null && !limitReached && (
                            <span className="argument-composer-remaining">
                                {remaining} submission{remaining === 1 ? '' : 's'} remaining today
                            </span>
                        )}
                    </div>

                    <button
                        className="argument-composer-submit"
                        type="submit"
                        disabled={submitDisabled}
                        aria-busy={submitting}
                    >
                        {submitting ? 'Submitting…' : '+ Submit Argument'}
                    </button>

                    {!isAuthenticated && (
                        <div className="argument-composer-alert argument-composer-alert-info">
                            <span className="argument-composer-alert-icon">i</span>
                            <span>Sign in to submit an argument.</span>
                        </div>
                    )}
                </form>

                {alertMsg && (
                    <div className="argument-composer-alert argument-composer-alert-error">
                        <span className="argument-composer-alert-icon">!</span>
                        <span>{alertMsg}</span>
                    </div>
                )}
            </div>

            {paneOpen && (
                <div className="argument-composer-pullout-overlay" onClick={() => setPaneOpen(false)}>
                    <aside className="argument-composer-pullout-pane" onClick={(e) => e.stopPropagation()}>
                        <div className="argument-composer-pullout-header">
                            <div>
                                <h3>Evidence library</h3>
                                <p>Select to cite, then close pane</p>
                            </div>
                            <button type="button" onClick={() => setPaneOpen(false)} aria-label="close pane">×</button>
                        </div>
                        <div className="argument-composer-pullout-list">
                            {evidenceList.length === 0 && (
                                <div className="minimal">No evidence submitted yet.</div>
                            )}
                            {evidenceList.map((ev) => (
                                <label className="argument-composer-pullout-item" key={ev.evidence_id}>
                                    <input
                                        type="checkbox"
                                        checked={citedEvidenceIds.includes(ev.evidence_id)}
                                        onChange={() => toggleEvidence(ev.evidence_id)}
                                    />
                                    <div>
                                        <div>Ev #{ev.evidence_id}: "{ev.text}"</div>
                                        <div className="argument-composer-pullout-sub">up {ev.up_votes} / down {ev.down_votes}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <button type="button" onClick={() => setPaneOpen(false)}>
                            Close pane
                        </button>
                    </aside>
                </div>
            )}
        </div>
    )
}

export default NewArgument;