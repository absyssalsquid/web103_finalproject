import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

import ProgressBar from '/src/components/ProgressBar'
import { useAuthContext } from '/src/contexts/auth'
import { getUsage } from '/src/api/me'
import { getUserLimits } from '/src/api/rules'
import { submitArgument } from '/src/api/cases'
import { LIMITS } from '/src/api/limits'

import './NewArgument.css'

function NewArgument({ onSubmitted }){
    const { id } = useParams()
    const { isAuthenticated } = useAuthContext();

    const [argument, setArgument] = useState('');
    const [userLimits, setUserLimits] = useState({})
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })
    const [limitsLoading, setLimitsLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [alertMsg, setAlertMsg] = useState('')

    const refreshUsage = async () => {
        const res = await getUsage()
        if (res.ok) setUsage(await res.json())
    }

    useEffect(() => {
        async function fetchData(){
            const res = await Promise.all([
                getUserLimits(),
                getUsage()
            ])
            if (res[0].ok) setUserLimits(await res[0].json())
            if (res[1].ok) setUsage(await res[1].json())
            setLimitsLoading(false)
        }
        fetchData();
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        if (alertMsg) setAlertMsg('')
        setSubmitting(true)

        const res = await submitArgument({ id, content: argument })
        const data = await res.json()

        if (res.ok){
            setArgument('')
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
                    <h3>Present Your Argument</h3>
                    <p>Make your case clearly and respectfully.</p>
                </div>

                <form className="argument-composer-form" onSubmit={submitHandler}>
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
        </div>
    )
}

export default NewArgument;

