import './CardHeader.css'

function CardHeader({ title, subtitle }) {
    return (
        <div className='CardHeader'>
            <div className='header'>
                <h2>{title}</h2>
                {subtitle && <p>{subtitle}</p>}
            </div>
        </div>
    )
}

export default CardHeader;
