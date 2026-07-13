import {Link} from 'react-router-dom'
import './CaseCard.css'
function CaseCard({data}){
    return (
        <div className="CaseCard">
            <div>{data.accusation} </div>
            <div>Case #{data.case_id}</div>
            <div>Phase: {data.phase} </div>
            <button>🔺{data.up_count}</button><button>🔻{data.down_count}</button>
            <Link to={`/cases/${data.case_id}`}>Read more</Link>
        </div>
    )
}

export default CaseCard;