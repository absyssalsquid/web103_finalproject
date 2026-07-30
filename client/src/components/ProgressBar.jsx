import './ProgressBar.css'

function ProgressBar({value, limit, label, limit_message}){
    return (
        <div className="ProgressBar">
            <label className='dark'>{label}: {value} of {limit} used</label>
            <progress value={value} max={limit} />
            {value>=limit && (
                <small>{limit_message}</small>
            )}
        </div>
    )
}

export default ProgressBar;