import './Achievements.css'

function Achievements({items}){
    return (
        <div className="Achievements sub-content">
            
            {items.map((item)=>{
                const earned = item.earned_at != null;

                return (
                <div className={"AchievementTile" + (earned?" earned":"")} key={item.achievement_id}>
                    <div className='head'>
                        <img src={item.img_src} />
                        <div className='name'>{item.name}</div>
                    </div>
                    <p className='requirements'>{item.requirements}</p>
                    <div className='earned-at'>
                        { earned
                            ? `earned ${item.earned_at.toLocaleDateString()}`
                            : <>{item.progress} / {item.threshold}</>
                        }
                    </div>
                    
                </div>
                )
            })}
        </div>
    )
}

export default Achievements;
