import { useNavigate } from "react-router-dom";
import { useState } from 'react'
import Countdown from 'react-countdown';

import {LIMITS} from "/src/api/limits"
import { getNextOccurrence } from "/src/utils"
import { consumeJurySummons } from "/src/api/jury.js"

import "./JuryDuty.css"


function JuryDuty(){
    const nav = useNavigate();
    const [alertMsg, setAlertMsg] = useState('')

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
            <form>
                <h2>Do you want to serve on a jury?</h2>
                <p>You have {3} jury summons remaining. Today's jury summons expire in <Countdown date={getNextOccurrence(LIMITS.REFRESH_TIME)}/></p>
                <button type="submit" onClick={handleNew} className="respond">Respond to jury summons</button>
            </form>
            {alertMsg && <div className='error-msg'>{alertMsg}</div>}
        </div>
    )
}

export default JuryDuty;