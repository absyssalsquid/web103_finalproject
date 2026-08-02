import { useState } from 'react'
import { useParams } from 'react-router-dom'

import { useAuthContext } from '/src/contexts/auth'
import { submitJudgeVerdict } from '/src/api/cases'

import "./CaseRuling.css"

const VERDICT_OPTIONS = [
    { value: 'GUILTY', label: 'Guilty' },
    { value: 'NOT_GUILTY', label: 'Not Guilty' },
    { value: 'TB_PECKED_AT', label: 'To Be Pecked At Later...' },
]

const RULING_MAX = 300

const CaseRuling = ({phaseDelta, caseData, data}) => {
    const { id: caseId } = useParams()
    const { user } = useAuthContext()

    const [selectedVerdict, setSelectedVerdict] = useState(null)
    const [rulingText, setRulingText] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [submitted, setSubmitted] = useState(false)

    const isActivePhase = phaseDelta == 0;
    const isAssignedJudge = user && caseData.judge_id === user.user_id;

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedVerdict) {
            setSubmitError('Select a verdict before submitting.')
            return
        }
        setSubmitting(true)
        setSubmitError('')
        try {
            const res = await submitJudgeVerdict(caseId, {
                verdict: selectedVerdict,
                judge_ruling: rulingText.trim(),
            })
            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Submission failed')
            }
            setSubmitted(true)
        } catch (err) {
            setSubmitError(err.message || 'Something went wrong submitting your ruling.')
        } finally {
            setSubmitting(false)
        }
    }

    let body;
    if (phaseDelta > 0) body = "Phase not started yet."
    else if (isActivePhase && !caseData.ruling) body = "Case under judge deliberation."
    else body = caseData.ruling

    return (
        <div className="CaseRuling sub-content">
            <div className="minimal">
                {body}
            </div>

            {isActivePhase && isAssignedJudge && !caseData.verdict && data && (
                <div className="judge-panel">
                    <h3>Judge decision</h3>
                    <p className="dim">
                        You are the assigned judge for this case.
                        {data.total != null && (
                            <> The jury recorded {data.total} vote{data.total === 1 ? '' : 's'}
                            {data.breakdown && (
                                <> ({data.breakdown.GUILTY} guilty / {data.breakdown.NOT_GUILTY} not guilty)</>
                            )}.</>
                        )}
                        {' '}Review the case, then publish the final ruling.
                    </p>

                    {submitted ? (
                        <p className="judge-submitted-msg">
                            Ruling submitted. It will appear here once the case closes.
                        </p>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="verdict-options">
                                {VERDICT_OPTIONS.map((opt) => (
                                    <button
                                        type="button"
                                        key={opt.value}
                                        className={selectedVerdict === opt.value ? 'verdict-btn active' : 'verdict-btn'}
                                        onClick={() => setSelectedVerdict(opt.value)}
                                        aria-pressed={selectedVerdict === opt.value}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>

                            <label htmlFor="judge-ruling">Ruling notes (optional)</label>
                            <textarea
                                id="judge-ruling"
                                value={rulingText}
                                maxLength={RULING_MAX}
                                onChange={(e) => setRulingText(e.target.value)}
                                placeholder="Explain your reasoning..."
                                rows={3}
                            />
                            <small className="char-limit">{rulingText.length} / {RULING_MAX}</small>

                            {submitError && <div className="error-msg">{submitError}</div>}

                            <button className="primary" type="submit" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Publish ruling'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    )
}
export default CaseRuling;