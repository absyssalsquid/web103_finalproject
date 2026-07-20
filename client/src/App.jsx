import { Link, useRoutes } from 'react-router-dom'

import { useState, useEffect } from 'react'
import Docket from './pages/Docket'
import Dashboard from './pages/Dashboard'
import NewCase from './pages/NewCase'
import Case from './pages/Case'
import UserProfile from './pages/UserProfile'
import SignIn from './pages/SignIn'
import Register from './pages/Register'
import JuryDuty from './pages/JuryDuty'
import Guidelines from './pages/Guidelines'

import './App.css'

import {getCurrentUserID} from './api/auth'

function App() {
  const [userID, setUserID] = useState(null)

  useEffect(()=>{
    async function getUserID(){
      const res = await getCurrentUserID();
      if (res) setUserID(res);
      
      // console.log("fetched id", id)
    }
    getUserID()
  },[])

  const element = useRoutes([
    {'path': '/'           , 'element': <Docket />},
    {'path': '/guidelines'    , 'element': <Guidelines />},
    {'path': '/sign-in'    , 'element': <SignIn />},
    {'path': '/register'    , 'element': <Register />},
    {'path': '/dashboard/*' , 'element': <Dashboard />},
    {'path': '/new-case'   , 'element': <NewCase/>},
    {'path': '/cases/:id/*'   , 'element': <Case />},
    {'path': '/profile/*'    , 'element': <UserProfile />},
    {'path': '/users/:id/*'   , 'element': <UserProfile />},
    {'path': '/jury-duty/:id/'   , 'element': <JuryDuty />},
    {'path': '/jury-duty/*'   , 'element': <JuryDuty />},
  ]);

  return (
      <>
        <nav className='Navigation'>
          <Link    className='nav-logo' to="/">Bird Court</Link>
          <div className='flex-grow'></div>
          <Link className="nav-link qmark" to="/guidelines"><img src="https://upload.wikimedia.org/wikipedia/commons/archive/d/d9/20110302085513%21Icon-round-Question_mark.svg"/></Link>
          { (!userID) && (<Link className="nav-link" to="/dashboard">Dashboard </Link>) }
          { (!userID) && (<Link className='nav-link' to="/sign-in">Sign&nbsp;in</Link>) } 
          {/* all conditions set to userID for testing, to see all tabs */}
        </nav>

        {element}
      </>
  )
}

export default App

