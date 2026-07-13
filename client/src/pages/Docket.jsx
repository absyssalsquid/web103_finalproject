import {Link} from 'react-router-dom';
import { useEffect, useState } from 'react'
import CaseCard from '../components/cards/CaseCard'

import './Docket.css'

const Docket = () => {
    const [loading, setLoading] = useState(true);
    const [cases, setCases] = useState([]);

    useEffect(() => {

        async function fetchData() {
            setCases([
                {case_id: 1, accusation: "bla", up_count: 13, down_count: 1},
                {case_id: 2, accusation: "bla", up_count: 13, down_count: 1},
                {case_id: 3, accusation: "bla", up_count: 13, down_count: 1},
                {case_id: 4, accusation: "bla", up_count: 13, down_count: 1}
            ]);
            setLoading(false);
        }

        fetchData();
    },[loading]);

    if (loading) {
        return (
            <div className="docket">
               Loading docket...
            </div>
        )
    }
    else
    return (
        <div className="docket">
            <div className='top-bar'>
                <Link to='/new-case' role='button'>Submit a case</Link>
                <select>
                    <option value=''>Provisional</option>
                    <option value=''>Discovery</option>
                    <option value=''>Argument</option>
                    <option value=''>Jury Deliberation</option>
                    <option value=''>Ruling</option>
                    <option value=''>Closed</option>
                </select>
                <select>
                    <option value='newest'>Newest</option>
                    <option value='oldest'>Oldest</option>
                    <option value='top'>Top rated</option>
                    <option value='time'>Countdown</option>
                </select>

            </div>
            <div className='case-container'>
                {cases.map((el) => (
                    <CaseCard key={el.case_id} data={el} />
                ))}
            </div>
        </div>
    )
}

export default Docket;