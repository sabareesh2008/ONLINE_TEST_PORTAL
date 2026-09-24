# Online Technical Assessment Portal 2026 🚀

A modern, responsive, high-performance web-based technical assessment platform built with pure **HTML5, CSS3, and Vanilla JavaScript**, backed by **Supabase PostgreSQL**. Designed for college departments and students with zero build step requirements—ready for instant deployment on **GitHub Pages**.

---

## 🌟 Key Features

- **Official Student Authentication**:
  - Validates student Register Numbers against the department roster (372 ECE students across Sections A, B, C, D, E, F).
  - **Instant Auto-Fill**: Auto-detects and populates candidate name, department, and section upon typing register number.
  - **Single Attempt Lockout**: Duplicate submissions are strictly blocked.
- **Live 50-Question Examination Engine**:
  - Pre-loaded with 50 curated technical MCQs across C, Data Structures, Algorithms, SQL, Operating Systems, Computer Networks, Python, and Java.
  - Interactive option selection (A, B, C, D).
  - Navigation controls: *Previous*, *Clear Choice*, *Mark for Review*, and *Save & Next*.
  - **1 to 50 Question Palette**: Color-coded tracking for Answered (Green), Unanswered (Gray), and Review (Purple).
- **Floating Countdown Timer (45:00)**:
  - Real-time countdown clock.
  - Visual status alerts (Amber below 10 mins, pulsing red below 2 mins).
  - **Auto-Submission**: Automatically submits and locks the test when the clock reaches `00:00`.
- **Supabase Cloud Backend**:
  - `students`: Official registered candidate roster.
  - `submissions`: Total marks, obtained marks, percentage, and time taken.
  - `submission_incorrect_answers`: Stores question-level error breakdowns for class advisor analytics.

---

## 📁 Project Structure

```
ONLINE_TEST_PORTAL/
├── index.html            # Main Portal (Student Login & Test Dashboard)
├── style.css             # Modern Dark Glassmorphism Portal Theme
├── app.js                # Core Assessment Engine & Timer Logic
├── questions.js          # 50 Curated Technical Questions & Answer Keys
├── students.js           # Client-side student roster
├── students.csv          # Official ECE student dataset (372 students)
├── supabase-config.js    # Supabase connection credentials
├── supabase_setup.sql    # 1-Click Database Setup Script for Supabase
└── README.md             # Project Documentation
```

---

## 🚀 How to Run Locally

Simply double-click `index.html` to open it in any browser (Chrome, Edge, Firefox).

Or run a local server:
```powershell
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## 🌐 Deploy to GitHub Pages (1 Click)

1. In this repository, click **Settings**.
2. On the left menu, select **Pages**.
3. Under **Branch**, select `main` / `root` and click **Save**.
4. Your exam portal will be live worldwide in seconds!

---

## 🗄️ Setting Up the Supabase Backend

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> Paste the code from `supabase_setup.sql` -> Click **Run**.
3. Copy your **Project URL** and **Anon Public Key** from *Project Settings > API*.
4. Paste them into `supabase-config.js`:
   ```javascript
   const SUPABASE_CONFIG = {
     url: "https://your-project.supabase.co",
     anonKey: "your-anon-public-key"
   };
   ```
