// import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';

import{toTitleCase} from '/src/utils'
import Pagination from '../Pagination';
import './JuryAssignments.css'

const now = Date.now();

function JuryAssignments({juryAssignments, pageInfo, setPageInfo}){
    const nav = useNavigate();
    return (
        <div className="JuryAssignments sub-content">
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
                    {juryAssignments.map((item)=>(
                        <tr key={item.id} onClick={()=>nav(`/jury-duty/${item.case_id}`)}>
                            <td>{item.created_at.toLocaleDateString()}</td>
                            <td><Link to={`/cases/${item.case_id}`}>{item.case_id}</Link></td>
                            <td>{toTitleCase(item.vote)}</td>
                            <td>{(now < item.expiration_date) ? 'open' : 'closed'}</td>
                            {/* <td><Link to={}>View</Link></td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination pageInfo={pageInfo} setPageInfo={setPageInfo}/>
        </div>
    )
}

export default JuryAssignments;