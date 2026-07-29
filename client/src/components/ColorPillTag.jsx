import './ColorPillTag.css'
import {toTitleCase} from '../utils'
import Countdown from 'react-countdown';

const TAG_COLORS = {
    'PROVISIONAL': '#b13ba1',
    'DISCOVERY': '#3B82F6',
    'ARGUMENT': '#dd6d11',
    'JURY_DELIBERATION': '#8B5CF6',
    'RULING': '#1faf4f',
    'CLOSED': '#5c5e54',
    'DISMISSED': '#093d3b',
    'WITHDRAWN': '#4c5a0e',
    
    'PROSECUTION': '#da2100cc', 
    'DEFENSE': '#9cbe14c7'
}

function ColorPillTag({phase, phase_end}){
    return (
        <div className={`ColorPillTag ${(phase_end!=null) ? 'timer' : ''}`} >
            <span className='name' style={{backgroundColor: TAG_COLORS[phase]}}>
                {toTitleCase(phase.replace('_', ' '))}
            </span>
            <Countdown className='countdown' 
                date={phase_end} 
                daysInHours={true}
                style={{border: `1px solid ${TAG_COLORS[phase]}`}}
            />
        </div>
    )
}

export default ColorPillTag;