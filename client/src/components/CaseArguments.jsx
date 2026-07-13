import ArgumentCard from "./cards/ArgumentCard";

const CaseArguments = ({phaseDelta,  data}) => {

    if (phaseDelta > 0)
        return (<div>Phase not started yet.</div>)

    const isActivePhase = phaseDelta == 0;

    return (
        <div>
            {isActivePhase && (<button className="btn btn-primary">Submit Argument</button>)}
            {data.length === 0 
                ? <p>No arguments submitted{isActivePhase && ' yet'}.</p> 
                : data.map((arg, index) => <ArgumentCard key={index} data={arg} />)}
        </div>
    )
}
export default CaseArguments;