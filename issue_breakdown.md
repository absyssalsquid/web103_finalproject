# Issue Breakdown by Feature

Each feature is broken down into sub-tasks following the vertical slice pattern. Use Option 1 (task lists in issue descriptions) to convert these into GitHub issues.

---

## Core Features

### 1. User Accounts (Registration, Login, Authentication)
- [ ] Database: Design users table with email, password hash, created_at, updated_at
- [ ] Database: Set up authentication schema (sessions/tokens if needed)
- [ ] Backend: Create /auth/register endpoint (validate email, hash password, create user)
- [ ] Backend: Create /auth/login endpoint (authenticate and return session/token)
- [ ] Backend: Create /auth/logout endpoint
- [ ] Frontend: Build sign-up form component
- [ ] Frontend: Build login form component
- [ ] Frontend: Build auth context/state management for current user
- [ ] Frontend: Add auth guards to protected routes

### 2. User Profiles
- [ ] Database: Add to users table: bio, profile_image_url, xp (default 0), created_at
- [ ] Database: Design achievements table (achievement_id, user_id, earned_at)
- [ ] Backend: Create GET /users/:id endpoint (return profile, stats, achievements)
- [ ] Backend: Create PUT /users/:id endpoint (update bio, profile image)
- [ ] Backend: Create GET /users/:id/contributions endpoint (cases they participated in)
- [ ] Frontend: Build user profile page component
- [ ] Frontend: Build profile stats section (XP, contribution count)
- [ ] Frontend: Build achievements display (highlighted + full list)
- [ ] Frontend: Add profile image upload

### 3. Case Submission
- [ ] Database: Design cases table (object_name, accusation, submitter_id, created_at, phase, status)
- [ ] Database: Add submission_count_today tracking (or calculate in backend)
- [ ] Backend: Create POST /cases endpoint (validate character limits, enforce daily limits)
- [ ] Backend: Create GET /cases endpoint (list all cases)
- [ ] Backend: Add daily submission limit validation (e.g., 1 per user per day)
- [ ] Frontend: Build case submission form component
- [ ] Frontend: Add character counter for accusation field
- [ ] Frontend: Show submission limit status to user
- [ ] Frontend: Add form validation and success confirmation

### 4. Case Lifecycle Management (Auto-progression)
- [ ] Database: Add phase column to cases (Provisional, Discovery, Arguments, Jury Deliberation, Verdict, Outcome)
- [ ] Database: Add phase_updated_at timestamp to track phase transitions
- [ ] Backend: Create scheduled job/cron (runs every 24h to progress cases)
- [ ] Backend: Add logic to lock voting/submissions when phase closes
- [ ] Backend: Create GET /cases/:id endpoint (return case with current phase)
- [ ] Frontend: Display current case phase on case detail page
- [ ] Frontend: Show countdown timer to next phase transition
- [ ] Frontend: Disable submission forms based on current phase

### 5. Case Directory / Search & Filter
- [ ] Database: Add indexes on phase, status, created_at for query performance
- [ ] Backend: Create GET /cases endpoint with filters (phase, status)
- [ ] Backend: Add sorting (by countdown, creation date, participation)
- [ ] Frontend: Build case list/directory page
- [ ] Frontend: Add filter UI (by case status/phase)
- [ ] Frontend: Add sorting dropdown
- [ ] Frontend: Display case cards with status and countdown
- [ ] Frontend: Add pagination if needed

### 6. Voting System (on Provisional Cases, Evidence, Arguments)
- [ ] Database: Design votes table (case_id, user_id, target_type, target_id, vote_type, created_at)
- [ ] Database: Add constraint to prevent duplicate votes per user per item
- [ ] Backend: Create POST /cases/:id/vote endpoint (vote on provisional case)
- [ ] Backend: Create POST /evidence/:id/vote endpoint (vote on evidence)
- [ ] Backend: Create POST /arguments/:id/vote endpoint (vote on arguments)
- [ ] Backend: Add vote count aggregation/calculation
- [ ] Backend: Add phase validation (prevent voting when phase is closed)
- [ ] Frontend: Build voting UI component (upvote/downvote arrows or buttons)
- [ ] Frontend: Display vote counts on cases, evidence, arguments
- [ ] Frontend: Handle vote submission and optimistic UI updates

### 7. Evidence Submission (Discovery Phase)
- [ ] Database: Design evidence table (case_id, submitter_id, description, image_url, created_at)
- [ ] Database: Add character limit validation at DB level
- [ ] Backend: Create POST /cases/:id/evidence endpoint (validate phase, limits, uploads image)
- [ ] Backend: Create GET /cases/:id/evidence endpoint (list all evidence for case)
- [ ] Backend: Integrate image upload (to Supabase storage)
- [ ] Frontend: Build evidence submission form component
- [ ] Frontend: Add character counter
- [ ] Frontend: Add image upload field
- [ ] Frontend: Display evidence list on case detail page
- [ ] Frontend: Show evidence with vote counts

### 8. Argument Submission (Argument Phase)
- [ ] Database: Design arguments table (case_id, submitter_id, text, created_at)
- [ ] Database: Design argument_citations table (argument_id, cited_evidence_id OR cited_case_id, citation_type)
- [ ] Backend: Create POST /cases/:id/arguments endpoint (validate phase, citations exist)
- [ ] Backend: Create GET /cases/:id/arguments endpoint (return all arguments with citations)
- [ ] Backend: Validate citations (evidence from current case or judgements from past cases)
- [ ] Frontend: Build argument submission form component
- [ ] Frontend: Add citation builder UI (search and select evidence/past cases)
- [ ] Frontend: Display up to 5 citations per argument
- [ ] Frontend: Show arguments with vote counts and citations on case detail

### 9. Jury System (Daily Summons & Service)
- [ ] Database: Design jury_summons table (user_id, created_at, used_at)
- [ ] Database: Design jury_votes table (jury_assignment_id, user_id, case_id, verdict, voted_at)
- [ ] Backend: Create daily job to award N jury summons per user
- [ ] Backend: Create POST /jury/serve endpoint (consume summons, assign random eligible case)
- [ ] Backend: Create POST /jury/:assignment_id/vote endpoint (record Guilty/Not Guilty/Insufficient Evidence)
- [ ] Backend: Logic to select eligible cases for jury duty
- [ ] Frontend: Build "Serve Jury Duty" button on dashboard
- [ ] Frontend: Build jury verdict screen (case info + voting buttons)
- [ ] Frontend: Display jury summons count
- [ ] Frontend: Show jury history in contribution section

### 10. Judge Decision Interface (After Jury Deliberation)
- [ ] Database: Design judge_verdict table (case_id, judge_id, final_status, decided_at)
- [ ] Database: Add assigned_judge_id to cases table
- [ ] Backend: Create logic to assign judge for each case
- [ ] Backend: Create GET /cases/:id/jury-verdict endpoint (calculate jury results)
- [ ] Backend: Create POST /cases/:id/judge-verdict endpoint (judge submits final status)
- [ ] Frontend: Build judge decision page (if user is assigned judge)
- [ ] Frontend: Display jury vote tallies
- [ ] Frontend: Build UI to submit final verdict (Guilty, Not Guilty, etc.)
- [ ] Frontend: Show decision on case detail page after verdict submitted

### 11. Participation Limits (Daily Caps)
- [ ] Database: Add tracking for submissions, votes, jury duty per user per day
- [ ] Backend: Add validation to POST endpoints (submissions, jury participation)
- [ ] Backend: Create GET /user/limits endpoint (show remaining submissions/jury for today)
- [ ] Frontend: Display participation limits on relevant forms
- [ ] Frontend: Show "limit reached" message when user hits cap
- [ ] Frontend: Allow unlimited voting (per spec)

### 12. Contribution History
- [ ] Backend: Create GET /users/:id/contributions endpoint (all cases they participated in)
- [ ] Backend: Return evidence, arguments, jury votes, submissions for each case
- [ ] Frontend: Build contributions page component
- [ ] Frontend: Display contributions organized by case
- [ ] Frontend: Show contribution type (submission, evidence, argument, jury vote)
- [ ] Frontend: Add filtering/sorting by contribution type or case

---

## Stretch Features

### 13. XP & Progression System
- [ ] Database: Add xp_total to users, xp_earned_per_contribution table
- [ ] Backend: Create XP award logic (define points per action type)
- [ ] Backend: Create POST endpoint to award XP when actions complete
- [ ] Backend: Create GET /users/:id/xp endpoint
- [ ] Frontend: Display XP total on user profile
- [ ] Frontend: Show XP earned notifications on contributions
- [ ] Frontend: Build XP progress bar/visualization

### 14. Achievement System
- [ ] Database: Design achievements table (id, name, description, criteria)
- [ ] Database: Design user_achievements table (user_id, achievement_id, earned_at)
- [ ] Backend: Create achievement unlock logic (check criteria after each action)
- [ ] Backend: Create GET /achievements endpoint (list all achievements)
- [ ] Backend: Create GET /users/:id/achievements endpoint (user's earned achievements)
- [ ] Frontend: Display earned achievements on profile with highlights
- [ ] Frontend: Show full achievement list (earned vs. locked)
- [ ] Frontend: Add achievement notification when user unlocks one

### 15. Leaderboard & Statistics
- [ ] Database: Create view/cached table for leaderboard stats (XP ranking, participation count)
- [ ] Backend: Create GET /leaderboard endpoint (sorted by XP)
- [ ] Backend: Create GET /statistics endpoint (global stats: total cases, participants, etc.)
- [ ] Frontend: Build leaderboard page component
- [ ] Frontend: Display top N users by XP
- [ ] Frontend: Show global statistics section
- [ ] Frontend: Add filters (weekly, all-time)

### 16. Moderation Tools
- [ ] Database: Design moderation_logs table (moderator_id, action, target_type, target_id, reason, created_at)
- [ ] Backend: Create admin role/permission system
- [ ] Backend: Create DELETE endpoints for content removal (cases, evidence, arguments)
- [ ] Backend: Create POST /admin/moderation endpoint (log moderation actions)
- [ ] Backend: Create GET /admin/moderation-logs endpoint
- [ ] Frontend: Build admin moderation panel (access restricted to admins)
- [ ] Frontend: Add content removal UI with reason logging
- [ ] Frontend: Build moderation review queue

---

## Notes

- **Phase validation:** Many features depend on case phase—ensure backend validates phase on every submission/voting endpoint
- **Image uploads:** Evidence and profile images need Supabase storage integration
- **Scheduled jobs:** Case progression and daily jury summons require a cron/scheduler (e.g., node-cron or Supabase functions)
- **Real-time updates:** Consider WebSockets for vote counts and phase transitions (stretch goal)