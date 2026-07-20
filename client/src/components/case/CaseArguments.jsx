import ArgumentCard from "../cards/ArgumentCard";

const CaseArguments = ({phaseDelta,  data}) => {

    if (phaseDelta > 0)
        return (<div>Phase not started yet.</div>)

    const isActivePhase = phaseDelta == 0;

    return (
        <div className="sub-content">
            {data.length === 0 
                ? <div className="minimal">No arguments submitted{isActivePhase && ' yet'}.</div> 
                : data.map((arg, index) => <ArgumentCard key={index} data={arg} />)}
        </div>
    )
}
export default CaseArguments;