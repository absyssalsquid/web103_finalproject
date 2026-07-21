import ArgumentCard from "../cards/ArgumentCard";
import "./CaseArguments.css"

const CaseArguments = ({phaseDelta,  data}) => {

    if (phaseDelta > 0)
        return (<div>Phase not started yet.</div>)

    const isActivePhase = phaseDelta == 0;

    return (
        <div className="CaseArguments sub-content">
            <div className="arguments-container">
                {data.length === 0 
                    ? <div className="minimal">No arguments submitted{isActivePhase && ' yet'}.</div> 
                    : data.map((arg, index) => <ArgumentCard key={index} data={arg} />)}
            </div>
        </div>
    )
}
export default CaseArguments;