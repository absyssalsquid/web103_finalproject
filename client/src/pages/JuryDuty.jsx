import { useState, useEffect } from 'react'
import { useNavigate, Link } from "react-router-dom";
import Countdown from 'react-countdown';

import ToastMessage from '../components/ToastMessage'
import CardHeader from '/src/components/card_fragments/CardHeader'
import { useAuthContext } from '/src/contexts/auth'

import { getUserLimits, getRefreshTime } from '/src/api/rules'
import { getUsage } from '/src/api/me'
import { consumeJurySummons } from "/src/api/jury.js"

import "./JuryDuty.css"

function JuryDuty(){
    const nav = useNavigate();
    const { isAuthenticated, isAuthLoading } = useAuthContext()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [toastMsg, setToastMsg] = useState({message: '', type:'', key: null})

    const [userLimits, setUserLimits] = useState({})
    const [refreshTime, setRefreshTime] = useState(null)
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })

    const atLimit = usage.jury_assignments >= userLimits.jury_assignments 

    useEffect(() => {
        async function fetchData(){
            if (isAuthenticated){
                const res = await Promise.all([
                    getRefreshTime(),
                    getUserLimits(),
                    getUsage()
                ])

                const data = await Promise.all(
                    res.map((item) => item.json()))

                setRefreshTime(new Date(data[0]))
                setUserLimits(data[1])
                setUsage(data[2])
                console.log(data)
            }
            setLoading(false)
        }
        fetchData();
    }, []);

    async function handleNew(e) {
        e.preventDefault()
        setSubmitting(true)
        const res = await consumeJurySummons();
        const data = await res.json();
        if (res.ok){
            if (data.ja_id)
                nav(`/jury/ballot/${data.ja_id}`)
            else
                setToastMsg({message: data.message, type: 'info', key: Date.now()});
        }
        else{
            console.log (res)
            setToastMsg({message: data.error, type: 'error', key: Date.now()});
        }
        setSubmitting(false)
    }

    if (loading || isAuthLoading){
        return (
            <div className='main-content minimal'>
                <h1>Loading jury portal...</h1>
                <div className='loader'></div>
            </div>
        )
    }
    
    if (!isAuthenticated){
        return (
            <div className='main-content minimal'>
                <h1><Link to="/sign-in">Sign in</Link> to serve on a jury.</h1>
            </div>
        )
    }

    return (
        <div className="JuryDuty main-content">
            <ToastMessage message={toastMsg.message} type={toastMsg.type} key={toastMsg.key}/>

            <div className='card-container'>
                <CardHeader title="Jury Assignment" />

                <div className="card">
                    <form onSubmit={handleNew}>
                        <h2>Do you want to serve on a jury?</h2>
                        <p>You have {userLimits.jury_assignments - usage.jury_assignments} jury summons remaining. Today's jury summons expire in <Countdown date={new Date(refreshTime)}/></p>
                        <button type="submit" className="primary" disabled={atLimit || submitting}>
                            {submitting ? "Submitting..." : "Respond to jury summons"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default JuryDuty;