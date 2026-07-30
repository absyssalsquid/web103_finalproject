import { useEffect, useRef, useState } from 'react';
import './Pagination.css'

function Pagination({history, setHistory}){
    const [pageQuery, setPageQuery] = useState('');
    const submittingRef = useRef(false);

    useEffect(()=>{
        function init() {
            setPageQuery(history.page)
        }
        init()
    }, [])

    function isValidPage(pageNum) {
        const num = parseInt(pageNum, 10);
        return !isNaN(num) && num >= 1 && num <= history.last_page;
    }

    function validateAndSetPage(pageNum){
        if (isValidPage(pageNum)) {
            setHistory((prev)=>({
                ...prev,
                page: pageNum
            }))
            setPageQuery(pageNum)
        }
        else {
            // restore to previous state
            setPageQuery(history.page)
        }
    }

    // ➤ Black Right Arrowhead. no left? only found equilateral left

    const isFirstPage = history.page === 1;
    const isLastPage = history.page === history.last_page;

    if (history.last_page === 1) return(<></>)

    return (
        <div className="Pagination">
            <div className='arrows'>
                <button className='arrow' disabled={isFirstPage} onClick={()=>validateAndSetPage(1)}>⮜⮜</button>
                <button className='arrow' disabled={isFirstPage} onClick={()=>validateAndSetPage(history.page-1)}>⮜</button>
                <div className="page-nums">
                    <input type='text'
                        value={pageQuery}
                        onChange={(e) => setPageQuery(e.target.value)}
                        onBlur={() => {
                            // Only reset if not currently submitting via button
                            if (!submittingRef.current) {
                                setPageQuery(history.page);
                            }
                        }} />
                    <div className='of'>/</div>
                    <div className='last-num'>{history.last_page}</div>
                </div>
                <button className='arrow' disabled={isLastPage} onClick={()=>validateAndSetPage(history.page+1)}>⮞</button>
                <button className='arrow' disabled={isLastPage} onClick={()=>validateAndSetPage(history.last_page)}>⮞⮞</button>
            </div>
            <button
                type='submit'
                onMouseDown={() => {
                    submittingRef.current = true;
                }}
                onMouseLeave={() => {
                    // User moved away; abort the submit
                    submittingRef.current = false;
                    setPageQuery(history.page);
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