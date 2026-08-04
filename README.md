# Bird Court

Designed and developed by:  
Tatiana Vela  
Tamara Berdichevsky  
Samuel Alemu  
Sri Narendrula  
Dien Tran  
Ying Wang  

🔗 Link to deployed app:

## About

### Description and Purpose
Bird Court is a community-driven web application where everyday objects are put on trial under an absurd legal system governed entirely by birds. The court is never concerned with human utility or legality. Users submit accusations, gather bizarre evidence, argue using precedent from previous cases, and ultimately decide each object's fate through jury deliberation. Every stage of the process is collaborative, creating an ever-growing body of whimsical bird jurisprudence.

### Inspiration

Wanted to do something whimsical and memorable. Inspired by "bird law" in the show It's Always Sunny in Philadelphia.

## Tech Stack

Frontend:
React

Backend:
Render
Node/Express

## Features

### ✅ User Accounts                               
Register, log in, and maintain a persistent account with XP, achievements, and participation history.                                                  
![user account gif](/walkthrough/user_accounts2.gif)

### ✅ Case Submission                             
Allows users to submit an object and accusation within the character limit while enforcing daily submission limits.                                    
![case submission gif](/walkthrough/case_submission2.gif)

### ✅ Case Directory                     
Stores cases with every phase: submissions, votes, verdict, and final outcome are preserved. For completed cases, it also displays what future cases reference it. Can filter by case status and sort by countdown to next phase.
![case directory gif](/walkthrough/docket.gif)

### ✅ Case Lifecycle Management                   
Automatically progresses cases every 24 hours: Provisional → Discovery → Arguments → Jury Deliberation → Verdict → Outcome on a daily schedule. Once a phase is closed, submissions in that phase cannot be voted on.
![case directory gif](/walkthrough/lifecycle.gif)

### ✅ Evidence Submission                         
During the Discovery phase, allows users to submit evidence with character limits and an optional image.                                                
![case directory gif](/walkthrough/evidence_submission.gif)

### ✅ Argument Submission                         
During Argument phase, allows users to submit arguments with character limits and up to five citations referencing evidence from current case or judgements from previous cases.                                
<!-- ![case directory gif](/walkthrough/arg_submission.gif) -->
![case directory gif](/walkthrough/form_validation.gif)

### ✅ Jury System
Each day, a user is issued N jury summons (e.g. 3). When they click "Serve Jury Duty", they consume one summons and are assigned a random eligible case in which they can vote Guilty or Not Guilty
![case directory gif](/walkthrough/jury_system.gif)

### ✅ Participation Limits                        
Enforces daily limits on submissions and jury participation while allowing unlimited eligible community voting.                                        
![case directory gif](/walkthrough/daily_limits.gif)

### ✅ Voting                                      
Lets users vote on provisional cases, evidence, and arguments.                                                                                         
![case directory gif](/walkthrough/voting.gif)

### ✅ User Profiles                               
Public profile displaying bio, profile image, XP, contribution statistics, highlighted achievements, and all achievements. Also allow image uploads.                             
![case directory gif](/walkthrough/profiles.gif)
------

### Contribution History                        
Lets users view all current and completed cases they have participated in, along with their evidence, arguments, jury service, and submissions.        
[gif here]

### Judge Decision Interface    *(stretch)*                 
Allows the assigned judge to declare the object's final legal status after the jury verdict.                                                           
[gif here]

### XP & Progression System     *(stretch)*     
Automatically awards XP for eligible actions, tracks totals, and records XP earned per contribution.                                                   
[gif here]

### Achievement System          *(stretch)*     
Awards achievements based on milestones and stores earned achievements for display on profiles.                                                        
[gif here]

### Leaderboard & Statistics    *(stretch)*     
Displays rankings based on XP and participation metrics to encourage community involvement.                                                            
[gif here]

### Moderation Tools            *(stretch)*   
Allows administrators to remove inappropriate content, resolve disputes, and manage user accounts without affecting the fictional courtroom mechanics. 
[gif here]


## Installation Instructions

[instructions go here]
