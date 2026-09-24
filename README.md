# Online Technical Assessment Portal 2026 🚀

A modern, responsive, high-performance web-based technical assessment platform built with pure **HTML5, CSS3, and Vanilla JavaScript**, backed by **Supabase PostgreSQL**. Designed for college departments and faculty with zero build step requirements—ready for instant deployment on **GitHub Pages**.

---

## 🌟 Key Features

### 🎓 Dual-Role Portal Architecture
1. **Student Portal**:
   - Validates student Register Numbers against the department roster (372 ECE students across Sections A through F).
   - **Instant Auto-Fill**: Auto-detects and populates candidate name, department, and section upon typing register number.
   - **Assessment Status Enforcement**: If test is unpublished or questions are not yet assigned, candidates see a clean *"There is no test right now"* notice.
   - **Interactive Examination Workspace**:
     - Supports **Multiple Choice Questions (MCQ)** with interactive option cards (A, B, C, D).
     - Supports **Fill in the Blanks (FIB)** with text inputs and auto-evaluation.
     - Question palette with real-time status indicators (Answered, Unanswered, Marked for Review, Current).
     - Real-time countdown timer with automated submission at `00:00`.
   - **Instant Evaluation & Results Screen**:
     - Calculates score, percentage, correct answer breakdown, and time spent.
     - Saves submission directly to Supabase cloud and local storage.

2. **Faculty & Admin Command Center (`admin` / `admin123`)**:
   - **Assessment Publishing Controller**: Instant toggle to Publish or Unpublish the test with custom test title and duration.
   - **Question Bank Manager (Excel & CSV)**:
     - Drag-and-drop or file upload supporting `.xlsx`, `.xls`, and `.csv`.
     - Supports both **MCQ** (Question, Options A-D, Correct Answer) and **Fill in the Blanks** (Question with blank, Correct Answer).
     - **1-Click Sample Question Template Download (`.CSV`)** directly in the dashboard for faculty reference.
     - Live preview table with type badges, options display, correct answers, and individual question deletion.
   - **Enroll New Student**: Add students directly into the Supabase database and local roster.
   - **Official Student Directory**: Filterable by section (A-F) with real-time candidate search.
   - **Section Completion Analytics & Live Submissions Tracker**: Real-time completion progress bars for each section (A-F) and submissions log.

---

## 📋 Question File Format (Excel / CSV)

Faculty can upload questions using either `.xlsx` / `.xls` (Excel) or `.csv` (Comma Separated Values).

### Columns Header Specification:
| Column | Description | MCQ | Fill in the Blanks (FIB) |
|---|---|---|---|
| `Type` | Question format | `MCQ` | `FIB` |
| `Category` | Subject / Topic | e.g. Data Structures | e.g. Networks |
| `Question` | Question prompt | Problem statement | Sentence with `_______` blank |
| `Option A` | First choice | Required | Leave empty |
| `Option B` | Second choice | Required | Leave empty |
| `Option C` | Third choice | Optional/Required | Leave empty |
| `Option D` | Fourth choice | Optional/Required | Leave empty |
| `Correct Answer` | Answer key | Letter (`A`, `B`, `C`, or `D`) or option text | Exact word/phrase |
| `Explanation` | Solution rationale | Optional | Optional |

> 💡 **Sample Template**: You can download `sample_question_template.csv` directly from the Admin Dashboard -> *Question Manager* tab.

---

## 📁 Project Structure

```
ONLINE_TEST_PORTAL/
├── index.html                 # Main Portal (Student Login, Admin Dashboard, Exam & Result Views)
├── style.css                  # Professional Slate Glassmorphism Institutional Theme
├── app.js                     # Core Application Logic, Excel/CSV Parser, Exam Runner & Timer
├── questions.js               # Questions bank definition
├── sample_question_template.csv # Sample CSV Template for Faculty Reference
├── students.js                # Official Client-side Student Dataset (372 ECE Candidates)
├── students.csv               # Raw Student Dataset across Sections A-F
├── supabase-config.js         # Direct REST Supabase API Integration
├── supabase_setup.sql         # 1-Click Database Setup Script for Supabase
└── README.md                  # Project Documentation
```

---

## 🚀 How to Run Locally

Double-click `index.html` to open in any modern browser (Chrome, Edge, Firefox, Safari).

Or run a local server:
```powershell
python -m http.server 8000
```
Then visit `http://localhost:8000`.

---

## 🌐 Deploy to GitHub Pages

1. In your GitHub repository, open **Settings**.
2. Select **Pages** from the sidebar.
3. Under **Branch**, select `main` / `root` and click **Save**.
4. The test portal is instantly live!
