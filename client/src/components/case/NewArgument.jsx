import { useState, useEffect } from 'react'

import ProgressBar from '/src/components/ProgressBar'
import { useAuthContext } from '/src/contexts/auth'
import { getUsage } from '/src/api/me'
import { getUserLimits } from '/src/api/rules'
import { submitArgument } from '/src/api/cases'
import { LIMITS } from '/src/api/limits'

function NewArgument({ caseId, onSubmitted }){
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

        const res = await submitArgument({ caseId, content: argument })
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

    return (
        <div className="NewCase main-content">
            <form onSubmit={submitHandler}>
                <div><label htmlFor="argument">Argument</label></div>
                <textarea
                    id="argument"
                    value={argument}
                    maxLength={LIMITS.ARGUMENT_MAX_LEN}
                    onChange={(e) => setArgument(e.target.value)}
                    placeholder="argue the case"
                    rows={4}
                    required
                />
                <small>{argument.length}/{LIMITS.ARGUMENT_MAX_LEN}</small>

                <ProgressBar
                    label="Daily argument submissions"
                    value={usage.arguments}
                    limit={userLimits.arguments}
                    limit_message={"You've reached your daily argument limit."}
                />

                <button className="btn btn-primary" type="submit" disabled={submitDisabled}>+ Submit Argument</button>
                {!isAuthenticated && <small>Sign in to submit an argument.</small>}
            </form>
            {alertMsg && <div className='error-msg'>{alertMsg}</div>}
        </div>
    )
}

export default NewArgument;

