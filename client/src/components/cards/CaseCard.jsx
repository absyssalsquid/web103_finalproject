import { Link } from 'react-router-dom'

import ColorPillTag from '../ColorPillTag'
import UserTag from '../UserTag'

import './CaseCard.css'

function CaseCard({ data }) {

    return (
        <div className="CaseCard">


            {data.image_url && (
                <img className="thumb" src={data.image_url} alt={data.object_name} />
            )}

            <div className="text">
                <div className="file-info">
                    <UserTag 
                        user_id={data.user_id} 
                        username={data.username} 
                        image_url={data.user_image_url} 
                        date={data.created_at.toLocaleDateString()}/>
                </div>
                <div className='case-num'>Case #{data.case_id}</div>
                <div className="accused">
                    <Link to={`/cases/${data.case_id}`} >
                        {data.object_name}
                    </Link>
                </div>

                <div className="accusation">{data.accusation}</div>

                
                <ColorPillTag phase={data.phase} phase_end={data.phase_end} />
            </div>
        </div>
    )
}

export default CaseCard;