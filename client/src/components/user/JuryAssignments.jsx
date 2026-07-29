import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';

import Pagination from '../Pagination';
import{toTitleCase} from '/src/utils'
import { getMyJuryAssignments } from '/src/api/me.js'

import './JuryAssignments.css'

const now = Date.now();

function JuryAssignments({history, setHistory}){
    const nav = useNavigate();

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
        })()
    }, [history.page, history.limit, setHistory])

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
                        </tr>
                    </thead>
                    <tbody>
                        {history.entries.map((item)=>(
                            <tr key={item.id} onClick={()=>nav(`/jury/ballot/${item.id}`)}>
                                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                                <td><Link to={`/cases/${item.case_id}`}>{item.case_id}</Link></td>
                                <td>{toTitleCase(item.vote)}</td>
                                <td>{(now < new Date(item.expires_at)) ? 'open' : 'closed'}</td>
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