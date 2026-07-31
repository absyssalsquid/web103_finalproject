import { useNavigate } from "react-router-dom";
import { useState, useEffect } from 'react'
import Countdown from 'react-countdown';

import { getUserLimits, getRefreshTime } from '/src/api/rules'
import { getUsage } from '/src/api/me'
import { consumeJurySummons } from "/src/api/jury.js"

import "./JuryDuty.css"

function JuryDuty(){
    const nav = useNavigate();
    const [alertMsg, setAlertMsg] = useState('')
    
    const [userLimits, setUserLimits] = useState({})
    const [refreshTime, setRefreshTime] = useState(null)
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })

    useEffect(() => {
        async function fetchData(){

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
        fetchData();
    }, []);

    async function handleNew(e) {
        e.preventDefault()
        const res = await consumeJurySummons();
        const data = await res.json();
        if (res.ok){
            if (data.ja_id)
                nav(`/jury/ballot/${data.ja_id}`)
            else
                setAlertMsg(data.message);
        }
        else{
            console.log (res)
            setAlertMsg(data.error);
        }
    }

    return (
        <div className="JuryDuty main-content">
            <div className="card">
                <form onSubmit={handleNew}>
                    <h2>Do you want to serve on a jury?</h2>
                    <p>You have {userLimits.jury_assignments - usage.jury_assignments} jury summons remaining. Today's jury summons expire in <Countdown date={new Date(refreshTime)}/></p>
                    <button type="submit" className="primary" >Respond to jury summons</button>
                </form>
            </div>
            {alertMsg && <div className='error-msg'>{alertMsg}</div>}
        </div>
    )
}

export default JuryDuty;