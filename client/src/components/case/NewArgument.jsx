import {useState, useEffect} from 'react'

import { getUsage } from '/src/api/me'
import { getUserLimits, getLengthLimits } from '/src/api/rules'

function NewCase(){
    const [argument, setAccusation] = useState('');

    const [userLimits, setUserLimits] = useState({})
    const [lengthLimits, setLengthLimits] = useState({})
    const [usage, setUsage] = useState({ jury_assignments: null, cases: null, evidence: null, arguments: null })


    useEffect(() => {
        async function fetchData(){

            const res = await Promise.all([
                getUserLimits(),
                getLengthLimits(),
                getUsage()
            ])

            const data = await Promise.all(
                res.map((item) => item.json()))

            setUserLimits(data[0])
            setLengthLimits(data[1])
            setUsage(data[2])
        }
        fetchData();
    }, []);

    return (
        <div className="NewCase main-content">
            <form>
                <div><label htmlFor="argument">Argument</label></div>
                <textarea
                    id="argument"
                    value={argument}
                    maxLength={lengthLimits.accusation_max}
                    onChange={(e) => setAccusation(e.target.value)}
                    placeholder="argue the case"
                    rows={4}
                    required
                />
                <small>{argument.length}/{lengthLimits.accusation_max}</small>
                <button className="btn btn-primary" disabled={false}>+ Submit Argument</button>
                
            </form>

        </div>
    )
}

export default NewCase;


