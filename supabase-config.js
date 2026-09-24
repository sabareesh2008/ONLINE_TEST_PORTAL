// Supabase Cloud Configuration & Lightweight Direct REST Engine
const SUPABASE_CONFIG = {
  url: "https://jehhjilmqoljxmsvnwgd.supabase.co",
  anonKey: "sb_publishable_4x2bY6PkwBmfdIW47ILf3w_L-Q0JoJQ"
};

// Direct, fast REST helper (zero external dependencies, zero CDN lag)
const SupabaseAPI = {
  isConfigured: () => {
    return Boolean(
      SUPABASE_CONFIG.url && 
      SUPABASE_CONFIG.anonKey && 
      !SUPABASE_CONFIG.url.includes("YOUR_PROJECT_ID")
    );
  },

  // Headers for Supabase PostgREST API
  getHeaders: () => {
    return {
      'apikey': SUPABASE_CONFIG.anonKey,
      'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  },

  // 1. Find Student by Register Number
  findStudent: async (regNo) => {
    if (!SupabaseAPI.isConfigured()) return null;
    const clean = encodeURIComponent(regNo.trim().toUpperCase());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/students?reg_no=eq.${clean}&select=*`, {
        headers: SupabaseAPI.getHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (err) {
      clearTimeout(timeout);
      console.warn('[Supabase REST] findStudent warning, falling back to local:', err.message);
      return null;
    }
  },

  // 2. Add New Student (Admin)
  addStudent: async ({ reg_no, name, department, section }) => {
    if (!SupabaseAPI.isConfigured()) return { success: false, error: 'Database not configured' };
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/students`, {
        method: 'POST',
        headers: SupabaseAPI.getHeaders(),
        body: JSON.stringify([{
          reg_no: reg_no.trim().toUpperCase(),
          name: name.trim(),
          department: department.trim(),
          section: section.trim().toUpperCase()
        }])
      });

      if (!res.ok) {
        const errText = await res.text();
        return { success: false, error: errText };
      }
      const data = await res.json();
      return { success: true, student: data[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 3. Get All Students (Admin Directory)
  getAllStudents: async () => {
    if (!SupabaseAPI.isConfigured()) return [];
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/students?select=*&order=reg_no.asc`, {
        headers: SupabaseAPI.getHeaders()
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('[Supabase REST] getAllStudents error:', err);
      return [];
    }
  },

  // 4. Check if student already submitted
  checkExistingSubmission: async (regNo) => {
    if (!SupabaseAPI.isConfigured()) return null;
    const clean = encodeURIComponent(regNo.trim().toUpperCase());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/submissions?reg_no=eq.${clean}&select=submitted_at,obtained_marks,total_marks`, {
        headers: SupabaseAPI.getHeaders(),
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!res.ok) return null;
      const data = await res.json();
      return Array.isArray(data) && data.length > 0 ? data[0] : null;
    } catch (err) {
      clearTimeout(timeout);
      console.warn('[Supabase REST] checkExistingSubmission warning:', err.message);
      return null;
    }
  },

  // 5. Get All Submissions (Admin Tracker)
  getAllSubmissions: async () => {
    if (!SupabaseAPI.isConfigured()) return [];
    try {
      const res = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/submissions?select=*&order=submitted_at.desc`, {
        headers: SupabaseAPI.getHeaders()
      });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn('[Supabase REST] getAllSubmissions error:', err);
      return [];
    }
  },

  // 6. Save Final Submission & Incorrect Answers
  saveSubmission: async (submissionData, incorrectAnswers = []) => {
    if (!SupabaseAPI.isConfigured()) return null;

    try {
      const subRes = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/submissions`, {
        method: 'POST',
        headers: SupabaseAPI.getHeaders(),
        body: JSON.stringify([{
          reg_no: submissionData.reg_no,
          student_name: submissionData.student_name,
          department: submissionData.department,
          section: submissionData.section,
          total_marks: submissionData.total_marks,
          obtained_marks: submissionData.obtained_marks,
          percentage: parseFloat(submissionData.percentage),
          time_taken_seconds: submissionData.time_taken_seconds
        }])
      });

      if (!subRes.ok) {
        console.error('[Supabase REST] Save submission failed:', await subRes.text());
        return null;
      }

      const inserted = await subRes.json();
      const submissionId = inserted && inserted[0] ? inserted[0].id : null;

      if (incorrectAnswers.length > 0) {
        const rows = incorrectAnswers.map(item => ({
          submission_id: submissionId,
          reg_no: submissionData.reg_no,
          student_name: submissionData.student_name,
          department: submissionData.department,
          section: submissionData.section,
          qno: item.qno,
          category: item.category,
          question_text: item.question,
          selected_option: item.selected,
          correct_option: item.correct,
          explanation: item.explanation
        }));

        await fetch(`${SUPABASE_CONFIG.url}/rest/v1/submission_incorrect_answers`, {
          method: 'POST',
          headers: SupabaseAPI.getHeaders(),
          body: JSON.stringify(rows)
        });
      }

      return submissionId;
    } catch (err) {
      console.error('[Supabase REST] saveSubmission error:', err);
      return null;
    }
  }
};
