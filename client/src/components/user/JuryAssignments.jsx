import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';

import Pagination from '../Pagination';
import{toTitleCase} from '/src/utils'
import { getMyJuryAssignments } from '/src/api/me.js'

import './JuryAssignments.css'

const now = Date.now();

function JuryAssignments({history, setHistory}){
    const nav = useNavigate();
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        (async ()=>{
            const res = await getMyJuryAssignments({page: history.page, limit: history.limit} )
            const data = await res.json()
            if (res.ok){
                setHistory((prev)=>({
                    ...prev,
                    last_page: data.last_page,
                    entries: data.entries
                }))
            }
            else {
                console.log(data.error)
            }
            setLoading(false)
        })()
    }, [history.page, history.limit, setHistory])

    if (loading)
    return (
        <div className="JuryAssignments sub-content">
            <div className='minimal'>
                <div>Loading jury assignments...</div>
                <div className='loader'></div>
            </div>
        </div>
    )

    return (
        <div className="JuryAssignments sub-content">
            <div className='table-container'>
                <table>
                    <thead>
                        <tr>
                            <th className='text-left'>Date</th>
                            <th className='text-left'>Case#</th>
                            <th className='text-left'>Vote</th>
                            <th className='text-left'>Status</th>
                            <th className='text-left'></th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.entries.map((item)=>(
                            <tr key={item.id}>
                                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                <td><Link to={`/cases/${item.case_id}`} className='case-link'>{item.case_id}</Link></td>
                                <td>{toTitleCase(item.vote)}</td>
                                <td>{(now < new Date(item.expires_at)) ? 'open' : 'closed'}</td>
                                <td><Link to={`/jury/ballot/${item.id}`} className='ballot-link'>👁</Link></td>
                                {/* <td><Link to={`/jury/ballot/${item.id}`}><img className="eye" src='/public/eye.png'/></Link></td> */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Pagination history={history} setHistory={setHistory}/>
        </div>
    )
}

export default JuryAssignments;