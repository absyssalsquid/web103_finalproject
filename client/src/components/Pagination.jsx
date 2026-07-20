import { useEffect, useRef, useState } from 'react';
import './Pagination.css'

function Pagination({pageInfo, setPageInfo}){
    const [pageQuery, setPageQuery] = useState('');
    const submittingRef = useRef(false);

    useEffect(()=>{
        function init() {
            setPageQuery(pageInfo.curr)
        }
        init()
    }, [])

    function isValidPage(pageNum) {
        const num = parseInt(pageNum, 10);
        return !isNaN(num) && num >= 1 && num <= pageInfo.last;
    }

    function validateAndSetPage(pageNum){
        if (isValidPage(pageNum)) {
            setPageInfo((prev)=>({
                ...prev,
                curr: pageNum
            }))
            setPageQuery(pageNum)
        }
        else {
            // restore to previous state
            setPageQuery(pageInfo.curr)
        }
    }

    // ➤ Black Right Arrowhead. no left? only found equilateral left

    return (
        <div className="Pagination">
            <div className='arrows'>
                <button className='arrow' onClick={()=>validateAndSetPage(1)}>⮜⮜</button>
                <button className='arrow' onClick={()=>validateAndSetPage(pageInfo.curr-1)}>⮜</button>
                <div className="page-nums">
                    <input type='text'
                        value={pageQuery}
                        onChange={(e) => setPageQuery(e.target.value)}
                        onBlur={() => {
                            // Only reset if not currently submitting via button
                            if (!submittingRef.current) {
                                setPageQuery(pageInfo.curr);
                            }
                        }} />
                    <div className='of'>/</div>
                    <div className='last-num'>{pageInfo.last}</div>
                </div>
                <button className='arrow' onClick={()=>validateAndSetPage(pageInfo.curr+1)}>⮞</button>
                <button className='arrow' onClick={()=>validateAndSetPage(pageInfo.last)}>⮞⮞</button> 
            </div>
            <button
                type='submit'
                onMouseDown={() => {
                    submittingRef.current = true;
                }}
                onMouseLeave={() => {
                    // User moved away; abort the submit
                    submittingRef.current = false;
                    setPageQuery(pageInfo.curr);
                }}
                onClick={() => {
                    validateAndSetPage(pageQuery);
                    submittingRef.current = false;
                }}
            >Go</button> 
        </div>
    )
}

export default Pagination;