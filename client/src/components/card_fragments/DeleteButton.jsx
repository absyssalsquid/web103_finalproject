import './DeleteButton.css'

function DeleteButton({handleDelete, disabled}){
    return (
        <div className="DeleteButton tooltip">
            <button className="delete" onClick={handleDelete} disabled={disabled}>🗑️</button>
            <span className='tooltiptext'>delete</span>
        </div>
    )
}

export default DeleteButton;