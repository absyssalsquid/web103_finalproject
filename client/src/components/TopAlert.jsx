import './TopAlert.css'

function TopAlert({ message }){
    return (
        <div className="TopAlert">
            <div className='alert'><div>⚠</div></div>
            <div>{message}</div>
        </div>
    )
}

export default TopAlert;
