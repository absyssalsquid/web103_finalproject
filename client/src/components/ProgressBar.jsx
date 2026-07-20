import './ProgressBar.css'

function ProgressBar({value, limit, label}){
    return (
        <div className="ProgressBar">
            <label className='dark'>{label}: {value} of {limit} used</label>
            <progress value={value} max={limit} />
            {value>=limit && (
                <small>You've reached your daily submission limit.</small>
            )}
        </div>
    )
}

export default ProgressBar;