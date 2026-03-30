/**
 * TeacherDashboard.jsx — BrindaWorld Teacher Dashboard
 * Phase 2 P2: Class management, student progress table, notes.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const T = {
  primary: '#d63384', secondary: '#7b2ff7', bg: '#fff0f5',
  card: '#fff', text: '#2d1b69', light: '#888', border: '#f0c0d8',
};

const btnPrimary = (disabled) => ({
  background: disabled ? '#ccc' : `linear-gradient(135deg, ${T.primary}, ${T.secondary})`,
  color: 'white', border: 'none', borderRadius: 9,
  padding: '0.6rem 1.5rem', cursor: disabled ? 'not-allowed' : 'pointer',
  fontWeight: 700, fontSize: '0.92rem',
});

const inputStyle = {
  width: '100%', padding: '0.6rem 0.8rem',
  border: `1.5px solid ${T.border}`, borderRadius: 8,
  fontSize: '0.93rem', boxSizing: 'border-box', fontFamily: 'inherit',
  outline: 'none', color: T.text, background: 'white',
};

function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('teacher_token')}` };
}

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create class form
  const [showCreate, setShowCreate] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Note form
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);

  // ── Auth guard ──
  useEffect(() => {
    if (!localStorage.getItem('teacher_token')) {
      navigate('/teacher/login');
    }
  }, [navigate]);

  // ── Load teacher profile + classes ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, classRes] = await Promise.all([
        fetch(`${API_BASE}/teachers/me`, { headers: authHeaders() }),
        fetch(`${API_BASE}/teachers/classes`, { headers: authHeaders() }),
      ]);
      if (!meRes.ok) throw new Error('Session expired');
      const meData = await meRes.json();
      const classData = await classRes.json();
      setTeacher(meData.teacher);
      setClasses(classData.classes || []);
    } catch (err) {
      console.error(err);
      localStorage.removeItem('teacher_token');
      localStorage.removeItem('teacher_user');
      navigate('/teacher/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Select class → load students ──
  const selectClass = async (cls) => {
    setSelectedClass(cls);
    setSelectedStudent(null);
    setStudentDetail(null);
    try {
      const res = await fetch(`${API_BASE}/teachers/classes/${cls.id}/students`, { headers: authHeaders() });
      const data = await res.json();
      setStudents(data.students || []);
    } catch { setStudents([]); }
  };

  // ── Select student → load detail ──
  const selectStudent = async (student) => {
    setSelectedStudent(student);
    try {
      const res = await fetch(
        `${API_BASE}/teachers/classes/${selectedClass.id}/student/${student.public_id}`,
        { headers: authHeaders() }
      );
      const data = await res.json();
      setStudentDetail(data);
    } catch { setStudentDetail(null); }
  };

  // ── Create class ──
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch(`${API_BASE}/teachers/classes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ className: newClassName.trim(), gradeLevel: newGrade || null }),
      });
      if (res.ok) {
        setNewClassName(''); setNewGrade(''); setShowCreate(false);
        await loadData();
      }
    } catch { /* ignore */ } finally { setCreateLoading(false); }
  };

  // ── Save note ──
  const handleSaveNote = async () => {
    if (!noteText.trim() || !selectedStudent) return;
    setNoteSaving(true);
    try {
      await fetch(`${API_BASE}/teachers/notes`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ childPublicId: selectedStudent.public_id, noteText: noteText.trim() }),
      });
      setNoteText('');
      await selectStudent(selectedStudent); // refresh
    } catch { /* ignore */ } finally { setNoteSaving(false); }
  };

  // ── Print report ──
  const printReport = () => {
    if (!studentDetail || !selectedStudent) return;
    const s = studentDetail;
    const stats = s.stats || {};
    const totalMin = Math.round((stats.total_seconds || 0) / 60);
    const html = `<!DOCTYPE html><html><head><title>Report - ${s.student.name}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;max-width:700px;margin:0 auto;padding:2rem;color:#2d1b69}
      h1{color:#d63384;border-bottom:2px solid #f0c0d8;padding-bottom:0.5rem}
      .stat{display:inline-block;background:#fff0f5;border:1px solid #f0c0d8;border-radius:10px;padding:0.75rem 1.25rem;margin:0.35rem;text-align:center}
      .stat .val{font-size:1.3rem;font-weight:800;color:#d63384}
      .stat .lbl{font-size:0.75rem;color:#888;text-transform:uppercase}
      table{width:100%;border-collapse:collapse;margin-top:1rem}
      th,td{padding:0.5rem;border-bottom:1px solid #f0c0d8;text-align:left;font-size:0.85rem}
      th{background:#fff0f5;font-weight:700}
      .notes{background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:1rem;margin-top:1rem}
      @media print{button{display:none!important}}
    </style></head><body>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><h1>Student Progress Report</h1><p>${s.student.name} (Age ${s.student.age}) ${s.student.avatar || ''}</p></div>
      <div style="text-align:right"><strong>BrindaWorld</strong><br/><span style="font-size:0.8rem;color:#888">${new Date().toLocaleDateString('en-CA')}</span></div>
    </div>
    <div style="margin:1rem 0">
      <div class="stat"><div class="val">${stats.total_sessions || 0}</div><div class="lbl">Sessions</div></div>
      <div class="stat"><div class="val">${totalMin}</div><div class="lbl">Minutes</div></div>
      <div class="stat"><div class="val">${stats.games_played || 0}</div><div class="lbl">Games</div></div>
      <div class="stat"><div class="val">${Math.round(stats.avg_score || 0)}%</div><div class="lbl">Avg Score</div></div>
    </div>
    <h3>Recent Sessions</h3>
    <table><tr><th>Game</th><th>Date</th><th>Duration</th><th>Score</th></tr>
    ${(s.sessions || []).slice(0, 15).map(sess => `<tr>
      <td>${sess.game_id}</td>
      <td>${new Date(sess.started_at).toLocaleDateString('en-CA')}</td>
      <td>${Math.round((sess.duration_seconds || 0) / 60)}m</td>
      <td>${sess.score_percent != null ? Math.round(sess.score_percent) + '%' : '-'}</td>
    </tr>`).join('')}
    </table>
    ${(s.notes || []).length ? `<div class="notes"><h3>Teacher Notes</h3>${s.notes.map(n => `<p><em>${new Date(n.created_at).toLocaleDateString('en-CA')}</em>: ${n.note_text}</p>`).join('')}</div>` : ''}
    <div style="margin-top:2rem;text-align:center;color:#888;font-size:0.8rem">Generated by BrindaWorld Teacher Portal</div>
    <button onclick="window.print()" style="margin-top:1rem;padding:0.6rem 1.5rem;background:linear-gradient(135deg,#d63384,#7b2ff7);color:white;border:none;border-radius:9px;font-weight:700;cursor:pointer">Print Report</button>
    </body></html>`;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher_token');
    localStorage.removeItem('teacher_user');
    navigate('/teacher/login');
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.primary }}>Loading... 🌸</div>;

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header style={{ background: `linear-gradient(135deg, ${T.primary}, ${T.secondary})`, padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.6rem' }}>🏫</span>
            <span style={{ color: 'white', fontSize: '1.2rem', fontWeight: 800 }}>BrindaWorld Teacher</span>
          </div>
          <button onClick={handleLogout} style={{ background: 'transparent', color: 'white', border: '1.5px solid rgba(255,255,255,0.55)', borderRadius: 9, padding: '0.42rem 1rem', cursor: 'pointer', fontSize: '0.83rem', fontWeight: 600 }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.25rem' }}>
        <h1 style={{ color: T.text, fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem' }}>
          Welcome, {teacher?.firstName}! 🏫
        </h1>
        <p style={{ color: T.light, margin: '0 0 1.5rem', fontSize: '0.9rem' }}>Manage your classes and track student progress.</p>

        {/* Classes */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {/* Left: Class List */}
          <div style={{ flex: '1 1 300px', minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ color: T.text, margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Your Classes</h2>
              <button onClick={() => setShowCreate(!showCreate)} style={btnPrimary(false)}>
                {showCreate ? 'Cancel' : '+ New Class'}
              </button>
            </div>

            {showCreate && (
              <form onSubmit={handleCreateClass} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '1.25rem', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>Class Name *</label>
                  <input type="text" required value={newClassName} onChange={e => setNewClassName(e.target.value)} style={inputStyle} placeholder="e.g. Grade 4 Section B" />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: T.text }}>Grade Level</label>
                  <input type="text" value={newGrade} onChange={e => setNewGrade(e.target.value)} style={inputStyle} placeholder="e.g. Grade 4" />
                </div>
                <button type="submit" disabled={createLoading} style={btnPrimary(createLoading)}>
                  {createLoading ? 'Creating...' : 'Create Class'}
                </button>
              </form>
            )}

            {classes.length === 0 ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '2rem', textAlign: 'center', color: T.light }}>
                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📚</p>
                <p>No classes yet. Create one to get started!</p>
              </div>
            ) : (
              classes.map(cls => (
                <div key={cls.id} onClick={() => selectClass(cls)} style={{
                  background: selectedClass?.id === cls.id ? '#fff0f5' : T.card,
                  border: `1.5px solid ${selectedClass?.id === cls.id ? T.primary : T.border}`,
                  borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '0.75rem', cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700, color: T.text, fontSize: '0.95rem' }}>{cls.class_name}</div>
                      <div style={{ color: T.light, fontSize: '0.8rem' }}>{cls.grade_level || 'No grade'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: T.primary, fontSize: '1.1rem' }}>{cls.student_count}</div>
                      <div style={{ color: T.light, fontSize: '0.72rem' }}>students</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem', background: '#f8f0ff', borderRadius: 6, padding: '0.35rem 0.6rem', fontSize: '0.78rem', color: T.secondary, fontWeight: 600, display: 'inline-block' }}>
                    Join Code: {cls.join_code}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Students / Detail */}
          <div style={{ flex: '2 1 500px', minWidth: 320 }}>
            {!selectedClass ? (
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '3rem', textAlign: 'center', color: T.light }}>
                <p style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👈</p>
                <p>Select a class to view students</p>
              </div>
            ) : !selectedStudent ? (
              <div>
                <h2 style={{ color: T.text, fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                  {selectedClass.class_name} — Students
                </h2>
                {students.length === 0 ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '2rem', textAlign: 'center', color: T.light }}>
                    <p>No students enrolled yet. Share the join code <strong style={{ color: T.primary }}>{selectedClass.join_code}</strong> with parents!</p>
                  </div>
                ) : (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fff0f5' }}>
                          <th style={{ padding: '0.7rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Student</th>
                          <th style={{ padding: '0.7rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Age</th>
                          <th style={{ padding: '0.7rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: T.text }}>This Week</th>
                          <th style={{ padding: '0.7rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Total Time</th>
                          <th style={{ padding: '0.7rem', textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: T.text }}>Last Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map(s => (
                          <tr key={s.public_id} onClick={() => selectStudent(s)} style={{ cursor: 'pointer', borderBottom: `1px solid ${T.border}` }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fdf2f8'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <td style={{ padding: '0.65rem', fontSize: '0.88rem', color: T.text }}>
                              <span style={{ marginRight: '0.35rem' }}>{s.avatar || '🧒'}</span>
                              <strong>{s.name}</strong>
                            </td>
                            <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.85rem', color: T.light }}>{s.age}</td>
                            <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.85rem', color: T.text, fontWeight: 600 }}>{s.sessions_this_week || 0} sessions</td>
                            <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.85rem', color: T.light }}>{Math.round((s.total_seconds || 0) / 60)}m</td>
                            <td style={{ padding: '0.65rem', textAlign: 'center', fontSize: '0.8rem', color: T.light }}>{s.last_active ? new Date(s.last_active).toLocaleDateString('en-CA') : 'Never'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              /* Student Detail Panel */
              <div>
                <button onClick={() => { setSelectedStudent(null); setStudentDetail(null); }} style={{ background: 'none', border: 'none', color: T.primary, cursor: 'pointer', fontWeight: 700, fontSize: '0.88rem', marginBottom: '1rem' }}>
                  ← Back to class
                </button>
                {studentDetail ? (
                  <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <div>
                        <h2 style={{ color: T.text, margin: '0 0 0.25rem', fontSize: '1.2rem', fontWeight: 800 }}>
                          {studentDetail.student.avatar} {studentDetail.student.name}
                        </h2>
                        <span style={{ color: T.light, fontSize: '0.85rem' }}>Age {studentDetail.student.age}</span>
                      </div>
                      <button onClick={printReport} style={btnPrimary(false)}>Print Report 🖨️</button>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Sessions', value: studentDetail.stats.total_sessions || 0 },
                        { label: 'Minutes', value: Math.round((studentDetail.stats.total_seconds || 0) / 60) },
                        { label: 'Games', value: studentDetail.stats.games_played || 0 },
                        { label: 'Avg Score', value: `${Math.round(studentDetail.stats.avg_score || 0)}%` },
                      ].map(s => (
                        <div key={s.label} style={{ background: '#fff0f5', border: `1px solid ${T.border}`, borderRadius: 10, padding: '0.65rem 1rem', textAlign: 'center', minWidth: 80 }}>
                          <div style={{ fontWeight: 800, color: T.primary, fontSize: '1.15rem' }}>{s.value}</div>
                          <div style={{ fontSize: '0.7rem', color: T.light, textTransform: 'uppercase' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recent sessions table */}
                    <h3 style={{ color: T.text, fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Recent Sessions</h3>
                    <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ background: '#fff0f5' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Game</th>
                            <th style={{ padding: '0.5rem' }}>Date</th>
                            <th style={{ padding: '0.5rem' }}>Duration</th>
                            <th style={{ padding: '0.5rem' }}>Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(studentDetail.sessions || []).slice(0, 10).map((sess, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                              <td style={{ padding: '0.45rem' }}>{sess.game_id}</td>
                              <td style={{ padding: '0.45rem', textAlign: 'center' }}>{new Date(sess.started_at).toLocaleDateString('en-CA')}</td>
                              <td style={{ padding: '0.45rem', textAlign: 'center' }}>{Math.round((sess.duration_seconds || 0) / 60)}m</td>
                              <td style={{ padding: '0.45rem', textAlign: 'center' }}>{sess.score_percent != null ? Math.round(sess.score_percent) + '%' : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Notes */}
                    <h3 style={{ color: T.text, fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.5rem' }}>Teacher Notes</h3>
                    {(studentDetail.notes || []).map((n, i) => (
                      <div key={i} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.6rem 0.9rem', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: T.light, fontSize: '0.75rem' }}>{new Date(n.created_at).toLocaleDateString('en-CA')}</span>
                        <p style={{ margin: '0.25rem 0 0', color: T.text }}>{n.note_text}</p>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note about this student..." style={{ ...inputStyle, flex: 1 }} />
                      <button onClick={handleSaveNote} disabled={noteSaving || !noteText.trim()} style={btnPrimary(noteSaving || !noteText.trim())}>
                        {noteSaving ? '...' : 'Save'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: T.light }}>Loading student details...</div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
