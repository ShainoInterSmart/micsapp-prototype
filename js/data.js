/* ==========================================================================
   MICSAPP seed dataset
   All records are FICTIONAL and generated deterministically for demonstration.
   No real MICS student, employee or financial information is used.
   ========================================================================== */
window.MICS = window.MICS || {};

MICS.seed = (function () {
  'use strict';

  // ---------- Deterministic random ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rnd = mulberry32(20260911);
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function between(a, b) { return a + rnd() * (b - a); }
  function int(a, b) { return Math.floor(between(a, b + 1)); }
  function normal(mean, sd) {
    var u = 1 - rnd(), v = rnd();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pad(n, w) { n = String(n); while (n.length < w) n = '0' + n; return n; }
  function round1(v) { return Math.round(v * 10) / 10; }

  // ---------- Demo calendar ----------
  var TODAY = '2026-11-11';            // Wednesday — fixed demo date
  var ACADEMIC_YEAR = '2026/27';
  var TERM = 'Term 1';
  var TERM_DAYS_ELAPSED = 48;

  // ---------- Programmes & classes ----------
  var programmes = [
    { id: 'GES-B', name: 'GES Basic (Primary & JHS)', short: 'GES Basic', curriculum: 'GES', exam: 'BECE', color: 'var(--chart-1)' },
    { id: 'GES-S', name: 'GES Senior High (WASSCE)', short: 'GES SHS', curriculum: 'GES', exam: 'WASSCE', color: 'var(--chart-2)' },
    { id: 'CAM', name: 'Cambridge IGCSE & A-Level', short: 'Cambridge', curriculum: 'Cambridge', exam: 'IGCSE / AS', color: 'var(--chart-3)' },
    { id: 'IBDP', name: 'IB Diploma Programme', short: 'IBDP', curriculum: 'IB', exam: 'IB DP', color: 'var(--chart-4)' }
  ];

  var subjectsByProgramme = {
    'GES-B': ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies', 'Computing', 'French', 'Ghanaian Language (Fante)', 'Creative Arts'],
    'GES-S': ['English Language', 'Core Mathematics', 'Integrated Science', 'Social Studies', 'Elective Mathematics', 'Physics', 'Chemistry', 'Biology'],
    'CAM': ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Computer Science', 'French'],
    'IBDP': ['English A: Lang & Lit', 'Mathematics: AA', 'Biology', 'Chemistry', 'Economics', 'French B', 'Theory of Knowledge']
  };

  // [id, name, programme, size, ageAtTerm, room, boardingRate]
  var classDefs = [
    ['CLS-B4', 'Basic 4', 'GES-B', 22, 9, 'Block A · A04', 0],
    ['CLS-B5', 'Basic 5', 'GES-B', 24, 10, 'Block A · A05', 0],
    ['CLS-B6', 'Basic 6', 'GES-B', 23, 11, 'Block A · A06', 0],
    ['CLS-JHS1A', 'JHS 1A', 'GES-B', 26, 12, 'Block B · B11', 0.2],
    ['CLS-JHS1B', 'JHS 1B', 'GES-B', 25, 12, 'Block B · B12', 0.2],
    ['CLS-JHS2A', 'JHS 2A', 'GES-B', 27, 13, 'Block B · B21', 0.25],
    ['CLS-JHS2B', 'JHS 2B', 'GES-B', 25, 13, 'Block B · B22', 0.25],
    ['CLS-JHS3A', 'JHS 3A', 'GES-B', 28, 14, 'Block B · B31', 0.3],
    ['CLS-SHS1S', 'SHS 1 Science', 'GES-S', 24, 15, 'Block C · C11', 0.55],
    ['CLS-SHS2S', 'SHS 2 Science', 'GES-S', 22, 16, 'Block C · C21', 0.55],
    ['CLS-SHS2B', 'SHS 2 Business', 'GES-S', 20, 16, 'Block C · C22', 0.5],
    ['CLS-SHS3G', 'SHS 3 General Arts', 'GES-S', 19, 17, 'Block C · C31', 0.5],
    ['CLS-IG9', 'IGCSE Year 9', 'CAM', 21, 14, 'Block D · D09', 0.35],
    ['CLS-IG10', 'IGCSE Year 10', 'CAM', 23, 15, 'Block D · D10', 0.4],
    ['CLS-IG11', 'IGCSE Year 11', 'CAM', 20, 16, 'Block D · D11', 0.45],
    ['CLS-AS12', 'AS Level Year 12', 'CAM', 16, 17, 'Block D · D12', 0.5],
    ['CLS-DP1', 'IB DP Year 1', 'IBDP', 18, 17, 'IB Centre · E01', 0.6],
    ['CLS-DP2', 'IB DP Year 2', 'IBDP', 15, 18, 'IB Centre · E02', 0.6]
  ];

  // ---------- Names ----------
  var femaleFirst = ['Ama', 'Akosua', 'Adwoa', 'Abena', 'Akua', 'Yaa', 'Afua', 'Efua', 'Esi', 'Araba', 'Maame', 'Naa', 'Dede', 'Ewurabena', 'Aba', 'Grace', 'Priscilla', 'Josephine', 'Michelle', 'Deborah', 'Elikem', 'Sedinam', 'Selasi', 'Nhyira', 'Adjoa', 'Afia', 'Serwaa', 'Ohemaa', 'Kukua', 'Abigail', 'Nana Adwoa', 'Edinam', 'Lordina', 'Vanessa', 'Rita', 'Benedicta', 'Hannah', 'Patience'];
  var maleFirst = ['Kwame', 'Kofi', 'Kwabena', 'Kwaku', 'Yaw', 'Kwesi', 'Kojo', 'Kobina', 'Ekow', 'Fiifi', 'Nii', 'Kweku', 'Papa', 'Elorm', 'Selorm', 'Delali', 'Edem', 'Jojo', 'Michael', 'Daniel', 'Emmanuel', 'Samuel', 'Joshua', 'Caleb', 'Nathaniel', 'Jeremiah', 'Kelvin', 'Nana Kwame', 'Ebo', 'Kwadwo', 'Bernard', 'Prince', 'Richmond', 'Godwin', 'Isaac', 'Dennis', 'Felix'];
  var surnames = ['Mensah', 'Owusu', 'Asante', 'Boateng', 'Osei', 'Agyeman', 'Addo', 'Darko', 'Ofori', 'Appiah', 'Amoah', 'Nkansah', 'Quaye', 'Tetteh', 'Lartey', 'Annan', 'Aidoo', 'Quansah', 'Ankrah', 'Badu', 'Frimpong', 'Gyamfi', 'Kyei', 'Ampofo', 'Danquah', 'Sarpong', 'Opoku', 'Yeboah', 'Acquah', 'Essel', 'Arthur', 'Eshun', 'Mills', 'Baidoo', 'Hagan', 'Nyarko', 'Kumi', 'Bonsu', 'Afful', 'Dadzie', 'Abakah', 'Antwi', 'Asamoah', 'Bekoe', 'Ocran', 'Wiredu', 'Amponsah', 'Agyei', 'Kusi', 'Owusu-Ansah', 'Adomako', 'Koomson', 'Sackey', 'Forson', 'Okafor', 'Adeyemi', 'Kuffour', 'Dogbe', 'Agbeko', 'Fiagbe'];
  var houses = ['Volta', 'Pra', 'Ankobra', 'Densu'];     // Volta/Pra: boys · Ankobra/Densu: girls
  var occupations = ['Civil Engineer', 'Medical Doctor', 'Banker', 'Pharmacist', 'Business Owner', 'Lecturer', 'Accountant', 'Lawyer', 'Nurse', 'Architect', 'IT Consultant', 'Trader', 'Civil Servant', 'Marketing Manager', 'Oil & Gas Engineer', 'Entrepreneur'];
  var phonePrefixes = ['24', '54', '55', '20', '50', '27', '26', '59'];
  function phone() { return '+233 ' + pick(phonePrefixes) + ' ' + int(100, 999) + ' ' + pad(int(0, 9999), 4); }
  function emailOf(name, domain) { return name.toLowerCase().replace(/[^a-z ]/g, '').trim().split(/\s+/).join('.') + '@' + (domain || 'gmail.com'); }

  // ---------- Employees ----------
  var employees = [];
  function emp(id, title, first, last, role, dept, type, extra) {
    var e = {
      id: id, title: title, first: first, last: last, name: (title ? title + ' ' : '') + first + ' ' + last,
      shortName: first + ' ' + last, role: role, department: dept, type: type,
      email: (first.split(' ')[0] + '.' + last).toLowerCase().replace(/[^a-z.]/g, '') + '@mics.edu.gh',
      phone: phone(), contract: 'Permanent', joined: '20' + pad(int(12, 25), 2) + '-0' + int(1, 9) + '-' + pad(int(1, 28), 2),
      status: 'Active', leaveBalance: int(4, 21), appraisal: 'Not started', grade: type === 'Teaching' ? 'T' + int(2, 5) : 'S' + int(1, 5),
      training: [], attendance: round1(clamp(normal(96.5, 2), 88, 100))
    };
    for (var k in extra) e[k] = extra[k];
    employees.push(e);
    return e;
  }
  emp('EMP-0001', 'Dr.', 'Abena', 'Owusu-Mensah', 'Head of School', 'Leadership', 'Non-teaching', { grade: 'L1', joined: '2019-08-01' });
  emp('EMP-0002', 'Mr.', 'Kwame', 'Asante', 'School Administrator', 'Administration', 'Non-teaching', { grade: 'L3', joined: '2018-01-08' });
  emp('EMP-0003', 'Mr.', 'Samuel', 'Quaye', 'Deputy Head (Academics)', 'Leadership', 'Teaching', { grade: 'L2' });
  emp('EMP-0004', 'Mrs.', 'Grace', 'Tetteh', 'Bursar / Finance Manager', 'Finance', 'Non-teaching', { grade: 'L3' });
  emp('EMP-0005', 'Mr.', 'Isaac', 'Lartey', 'HR Manager', 'Human Resources', 'Non-teaching', { grade: 'L3' });
  emp('EMP-0006', 'Ms.', 'Naa Dedei', 'Ankrah', 'Admissions Officer', 'Administration', 'Non-teaching', {});
  emp('EMP-0007', 'Mr.', 'Ebo', 'Hagan', 'Facilities Manager', 'Facilities', 'Non-teaching', { grade: 'L4' });
  emp('EMP-0008', 'Mrs.', 'Comfort', 'Amoah', 'Senior Housemistress', 'Boarding', 'Non-teaching', {});
  emp('EMP-0009', 'Mr.', 'Kwaku', 'Sarpong', 'Catering Manager', 'Kitchen & Catering', 'Non-teaching', {});
  emp('EMP-0010', 'Mr.', 'Joseph', 'Nyarko', 'Head of Security', 'Security', 'Non-teaching', {});
  emp('EMP-0011', 'Nurse', 'Mabel', 'Dadzie', 'School Nurse', 'Infirmary', 'Non-teaching', {});
  emp('EMP-0012', 'Mr.', 'Felix', 'Annan', 'IB DP Coordinator', 'IB Programme', 'Teaching', { subjects: ['Economics'] });
  emp('EMP-0013', 'Mrs.', 'Linda', 'Mills', 'Cambridge Coordinator', 'Cambridge Programme', 'Teaching', { subjects: ['English'] });
  emp('EMP-0014', 'Mrs.', 'Efua', 'Boateng', 'Head of Mathematics', 'Mathematics', 'Teaching', { subjects: ['Mathematics', 'Core Mathematics'], appraisal: 'Self-review submitted' });
  emp('EMP-0015', 'Mr.', 'Kofi', 'Badu', 'Electrician', 'Facilities', 'Non-teaching', {});
  emp('EMP-0016', 'Mr.', 'Yaw', 'Kyei', 'Plumber', 'Facilities', 'Non-teaching', {});
  emp('EMP-0017', 'Mr.', 'Emmanuel', 'Afful', 'Carpenter', 'Facilities', 'Non-teaching', {});
  emp('EMP-0018', 'Mr.', 'Michael', 'Essel', 'ICT Support Technician', 'ICT', 'Non-teaching', {});
  emp('EMP-0019', 'Mr.', 'Kwabena', 'Gyamfi', 'Grounds Supervisor', 'Facilities', 'Non-teaching', {});
  emp('EMP-0020', 'Mr.', 'Daniel', 'Agyei', 'Senior Housemaster', 'Boarding', 'Non-teaching', {});
  emp('EMP-0021', 'Mrs.', 'Victoria', 'Ocran', 'Librarian', 'Library', 'Non-teaching', {});
  emp('EMP-0022', 'Ms.', 'Selasi', 'Dogbe', 'Accounts Officer', 'Finance', 'Non-teaching', {});
  emp('EMP-0023', 'Mr.', 'Bernard', 'Koomson', 'Internal Auditor', 'Audit & Risk', 'Non-teaching', {});
  emp('EMP-0024', 'Mrs.', 'Hannah', 'Forson', 'Front Office & Reception', 'Administration', 'Non-teaching', {});
  emp('EMP-0025', 'Mr.', 'Prince', 'Sackey', 'Transport Officer', 'Administration', 'Non-teaching', {});
  emp('EMP-0026', 'Mrs.', 'Patience', 'Kusi', 'Assistant Cook', 'Kitchen & Catering', 'Non-teaching', { contract: 'Fixed-term' });

  var teacherDefs = [
    ['Mathematics', ['Mathematics', 'Core Mathematics', 'Elective Mathematics', 'Mathematics: AA'], 4],
    ['Sciences', ['Integrated Science', 'Physics', 'Chemistry', 'Biology'], 7],
    ['Languages', ['English Language', 'English', 'English A: Lang & Lit', 'French', 'French B', 'Ghanaian Language (Fante)'], 7],
    ['Humanities', ['Social Studies', 'Economics', 'Theory of Knowledge'], 4],
    ['ICT & Computing', ['Computing', 'Computer Science'], 2],
    ['Creative Arts & PE', ['Creative Arts'], 3],
    ['Primary', ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'], 4]
  ];
  var empNo = 27;
  teacherDefs.forEach(function (td) {
    for (var i = 0; i < td[2]; i++) {
      var female = rnd() < 0.5;
      var first = pick(female ? femaleFirst : maleFirst);
      var last = pick(surnames);
      var subj = [td[1][i % td[1].length]];
      if (td[1].length > 1 && rnd() < 0.5) subj.push(td[1][(i + 1) % td[1].length]);
      emp('EMP-' + pad(empNo++, 4), female ? (rnd() < 0.5 ? 'Mrs.' : 'Ms.') : 'Mr.', first, last,
        i === 0 && td[0] !== 'Mathematics' ? 'Head of ' + td[0] : (td[0] === 'Primary' ? 'Class Teacher' : 'Teacher'),
        td[0], 'Teaching', { subjects: subj, contract: rnd() < 0.15 ? 'Fixed-term' : 'Permanent' });
    }
  });
  // Additional support staff
  var supportRoles = [['Housemistress', 'Boarding'], ['Housemaster', 'Boarding'], ['Cook', 'Kitchen & Catering'], ['Kitchen Assistant', 'Kitchen & Catering'], ['Security Officer', 'Security'], ['Security Officer', 'Security'], ['Security Officer', 'Security'], ['Cleaner', 'Facilities'], ['Cleaner', 'Facilities'], ['Driver', 'Administration'], ['Teaching Assistant', 'Primary'], ['Teaching Assistant', 'Primary'], ['Lab Technician', 'Sciences'], ['Nurse Assistant', 'Infirmary'], ['Storekeeper', 'Kitchen & Catering']];
  supportRoles.forEach(function (r) {
    var female = rnd() < 0.5;
    emp('EMP-' + pad(empNo++, 4), female ? 'Ms.' : 'Mr.', pick(female ? femaleFirst : maleFirst), pick(surnames), r[0], r[1],
      r[0] === 'Teaching Assistant' || r[0] === 'Lab Technician' ? 'Non-teaching' : 'Non-teaching', { contract: rnd() < 0.3 ? 'Fixed-term' : 'Permanent' });
  });
  // Appraisal & training spread
  var appraisalStates = ['Completed', 'Completed', 'Completed', 'Manager review', 'Self-review submitted', 'Not started', 'Completed', 'Manager review'];
  var trainings = ['Safeguarding & Child Protection', 'First Aid Certification', 'IB Category 2 Workshop', 'Cambridge Assessment Training', 'Digital Pedagogy (Google Workspace)', 'Fire Safety Drill Lead', 'Inclusive Learning Support', 'Food Hygiene Level 2'];
  employees.forEach(function (e, i) {
    if (i > 2 && e.id !== 'EMP-0014') e.appraisal = appraisalStates[i % appraisalStates.length];
    var n = int(1, 3);
    for (var k = 0; k < n; k++) {
      e.training.push({ course: trainings[(i + k * 3) % trainings.length], date: '2026-' + pad(int(1, 10), 2) + '-' + pad(int(1, 28), 2), status: rnd() < 0.85 ? 'Completed' : 'Scheduled' });
    }
  });
  employees.find(function (e) { return e.id === 'EMP-0014'; }).training = [
    { course: 'Safeguarding & Child Protection', date: '2026-08-27', status: 'Completed' },
    { course: 'Cambridge Assessment Training', date: '2026-10-14', status: 'Completed' },
    { course: 'Digital Pedagogy (Google Workspace)', date: '2026-11-25', status: 'Scheduled' }
  ];

  function teachersFor(subject) {
    return employees.filter(function (e) { return e.type === 'Teaching' && e.subjects && e.subjects.indexOf(subject) > -1; });
  }

  // ---------- Classes & allocations ----------
  var tutorPool = employees.filter(function (e) { return e.type === 'Teaching' && e.id !== 'EMP-0003'; });
  var classes = classDefs.map(function (c, i) {
    var tutor = c[0] === 'CLS-JHS2A' ? 'EMP-0014' : tutorPool[(i * 3 + 5) % tutorPool.length].id;
    return { id: c[0], name: c[1], programmeId: c[2], capacity: c[3] + int(2, 6), age: c[4], room: c[5], boardingRate: c[6], tutorId: tutor };
  });
  if (classes[5].tutorId !== 'EMP-0014') classes[5].tutorId = 'EMP-0014';

  var efuaClasses = ['CLS-JHS2A', 'CLS-JHS2B', 'CLS-JHS3A', 'CLS-SHS1S'];
  var allocations = [];
  classes.forEach(function (c, ci) {
    subjectsByProgramme[c.programmeId].forEach(function (s, si) {
      var t;
      if ((s === 'Mathematics' || s === 'Core Mathematics') && efuaClasses.indexOf(c.id) > -1) t = 'EMP-0014';
      else {
        var pool = teachersFor(s).filter(function (e) { return e.id !== 'EMP-0014'; });
        if (c.programmeId === 'GES-B' && /^CLS-B\d/.test(c.id)) {
          var prim = employees.filter(function (e) { return e.department === 'Primary' && e.type === 'Teaching'; });
          if (prim.length && ['English Language', 'Mathematics', 'Integrated Science', 'Social Studies'].indexOf(s) > -1) pool = prim;
        }
        t = pool.length ? pool[(ci + si) % pool.length].id : 'EMP-0003';
      }
      allocations.push({ classId: c.id, subject: s, teacherId: t, periods: s.indexOf('Math') > -1 || s.indexOf('English') > -1 ? 6 : 4 });
    });
  });

  // ---------- Students ----------
  var slots = [];
  classDefs.forEach(function (c) { for (var i = 0; i < c[3]; i++) slots.push(c[0]); });
  for (var s = slots.length - 1; s > 0; s--) { var j = Math.floor(rnd() * (s + 1)); var tmp = slots[s]; slots[s] = slots[j]; slots[j] = tmp; }
  function forceSlot(idx, classId) {
    if (slots[idx] === classId) return;
    for (var j = 0; j < slots.length; j++) if (slots[j] === classId && j !== idx && j !== 11 && j !== 46) { var t = slots[idx]; slots[idx] = slots[j]; slots[j] = t; return; }
  }
  forceSlot(11, 'CLS-JHS2A');
  forceSlot(46, 'CLS-IG10');

  var classById = {}; classes.forEach(function (c) { classById[c.id] = c; });
  var clubs = [
    { id: 'CLB-01', name: 'STEM & Robotics Club', patronId: 'EMP-0018', category: 'STEM', day: 'Tuesday' },
    { id: 'CLB-02', name: 'Debate & Public Speaking', patronId: 'EMP-0013', category: 'Academic', day: 'Thursday' },
    { id: 'CLB-03', name: 'Football Academy', patronId: 'EMP-0020', category: 'Sports', day: 'Mon / Wed' },
    { id: 'CLB-04', name: 'Basketball', patronId: 'EMP-0020', category: 'Sports', day: 'Friday' },
    { id: 'CLB-05', name: 'Choir & Music Ensemble', patronId: 'EMP-0008', category: 'Arts', day: 'Wednesday' },
    { id: 'CLB-06', name: 'Model United Nations', patronId: 'EMP-0012', category: 'Leadership', day: 'Thursday' },
    { id: 'CLB-07', name: 'Drama & Cultural Troupe', patronId: 'EMP-0008', category: 'Arts', day: 'Friday' },
    { id: 'CLB-08', name: 'Environmental & Eco Club', patronId: 'EMP-0019', category: 'Community', day: 'Tuesday' },
    { id: 'CLB-09', name: 'Coding & Digital Media', patronId: 'EMP-0018', category: 'STEM', day: 'Monday' },
    { id: 'CLB-10', name: 'Athletics', patronId: 'EMP-0020', category: 'Sports', day: 'Tue / Thu' }
  ];

  var students = [];
  var parents = [];
  slots.forEach(function (classId, i) {
    var c = classById[classId];
    var female = rnd() < 0.5;
    var first = pick(female ? femaleFirst : maleFirst);
    var last = pick(surnames);
    var att = clamp(normal(93.6, 3.4), 78, 100);
    var avg = clamp(normal(c.programmeId === 'IBDP' ? 72 : c.programmeId === 'CAM' ? 70 : 67, 8.5), 41, 96);
    var boarding = rnd() < c.boardingRate;
    var house = female ? (rnd() < 0.5 ? 'Ankobra' : 'Densu') : (rnd() < 0.5 ? 'Volta' : 'Pra');
    var yob = 2026 - c.age - (rnd() < 0.3 ? 1 : 0);
    var attTotal = TERM_DAYS_ELAPSED;
    var st = {
      id: 'STU-' + pad(i + 1, 4), first: first, last: last, name: first + ' ' + last,
      gender: female ? 'Female' : 'Male', dob: yob + '-' + pad(int(1, 12), 2) + '-' + pad(int(1, 28), 2),
      classId: classId, programmeId: c.programmeId, house: house, boarding: boarding,
      attTotal: attTotal, attPresent: Math.round(attTotal * att / 100),
      avg: round1(avg), status: 'Active', admitted: (2026 - int(0, Math.min(6, c.age - 8))) + '-09-0' + int(1, 8),
      nationality: rnd() < 0.9 ? 'Ghanaian' : pick(['Nigerian', 'British-Ghanaian', 'Ivorian', 'Togolese', 'Lebanese-Ghanaian']),
      clubs: [], guardianId: null, support: null
    };
    var nc = int(0, 2);
    for (var k = 0; k < nc; k++) { var cl = clubs[int(0, clubs.length - 1)].id; if (st.clubs.indexOf(cl) < 0) st.clubs.push(cl); }
    students.push(st);
  });

  // Story students
  function story(id, patch) { var st = students.find(function (x) { return x.id === id; }); for (var k in patch) st[k] = patch[k]; return st; }
  story('STU-0012', { first: 'Ama', last: 'Adjei', name: 'Ama Adjei', gender: 'Female', dob: '2013-04-17', classId: 'CLS-JHS2A', programmeId: 'GES-B', house: 'Densu', boarding: false, attPresent: 46, avg: 78.6, admitted: '2019-09-03', nationality: 'Ghanaian', clubs: ['CLB-02', 'CLB-05'] });
  story('STU-0047', { first: 'Yaw', last: 'Adjei', name: 'Yaw Adjei', gender: 'Male', dob: '2011-09-02', classId: 'CLS-IG10', programmeId: 'CAM', house: 'Volta', boarding: true, attPresent: 44, avg: 64.2, admitted: '2022-09-05', nationality: 'Ghanaian', clubs: ['CLB-01', 'CLB-03'] });
  // A handful of students intentionally flagged for academic attention (consistent across modules)
  [['STU-0031', 52.4, 39], ['STU-0088', 48.9, 43], ['STU-0102', 61.3, 38], ['STU-0140', 46.1, 45], ['STU-0177', 53.8, 40], ['STU-0215', 57.2, 37], ['STU-0263', 44.5, 42], ['STU-0301', 49.2, 42], ['STU-0356', 58.9, 39]].forEach(function (r) {
    story(r[0], { avg: r[1], attPresent: r[2] });
  });
  // Learning support notes (7+1 model) — non-sensitive academic notes only
  ['STU-0031', 'STU-0088', 'STU-0263'].forEach(function (id) { story(id, { support: 'Enrolled in 7+1 peer-teaching support in Mathematics' }); });

  // Parents
  var pNo = 1;
  students.forEach(function (st) {
    if (st.id === 'STU-0047') return; // shares guardian with STU-0012
    var pid = 'PAR-' + pad(pNo++, 4);
    var female = rnd() < 0.45;
    var pfirst = pick(female ? ['Comfort', 'Gifty', 'Mercy', 'Joyce', 'Agnes', 'Evelyn', 'Beatrice', 'Felicia', 'Rebecca', 'Esther', 'Doris', 'Gloria'] : ['Kofi', 'Kwame', 'Joseph', 'Emmanuel', 'Francis', 'George', 'Stephen', 'Charles', 'Ebenezer', 'Peter', 'Alex', 'Victor']);
    var p = { id: pid, title: female ? 'Mrs.' : 'Mr.', first: pfirst, last: st.last, name: pfirst + ' ' + st.last, relation: female ? 'Mother' : 'Father', phone: phone(), email: emailOf(pfirst + ' ' + st.last), occupation: pick(occupations), address: pick(['Swedru', 'Winneba', 'Kasoa', 'Cape Coast', 'Accra — East Legon', 'Accra — Spintex', 'Takoradi', 'Mankessim', 'Agona Nsaba']), studentIds: [st.id] };
    if (st.id === 'STU-0012') {
      p.title = 'Mr.'; p.first = 'Kofi'; p.last = 'Adjei'; p.name = 'Kofi Adjei'; p.relation = 'Father'; p.email = 'kofi.adjei@example.com';
      p.phone = '+233 24 418 2207'; p.occupation = 'Civil Engineer'; p.address = 'Agona Swedru'; p.studentIds = ['STU-0012', 'STU-0047'];
      p.secondary = { name: 'Mrs. Akosua Adjei', relation: 'Mother', phone: '+233 20 553 9184', email: 'akosua.adjei@example.com' };
    }
    st.guardianId = pid;
    parents.push(p);
  });
  story('STU-0047', { guardianId: students.find(function (x) { return x.id === 'STU-0012'; }).guardianId });

  // ---------- Fees & invoices (GHS, illustrative) ----------
  var termFee = { 'GES-B': 6800, 'GES-S': 7900, 'CAM': 14500, 'IBDP': 21000 };
  var boardingFee = 5200;
  var invoices = [];
  var payments = [];
  var payNo = 1;
  var methods = ['Bank transfer', 'Bank transfer', 'Mobile Money', 'Bank deposit', 'Cheque'];
  students.forEach(function (st, i) {
    var amount = termFee[st.programmeId] + (st.boarding ? boardingFee : 0);
    var r = rnd();
    var paidRatio = r < 0.62 ? 1 : r < 0.84 ? round1(between(0.35, 0.8)) : r < 0.94 ? 0.5 : 0;
    var paid = Math.round(amount * paidRatio / 50) * 50;
    if (st.id === 'STU-0012') paid = amount;
    if (st.id === 'STU-0047') paid = 10000;
    var inv = { id: 'INV-27T1-' + pad(i + 1, 4), studentId: st.id, term: 'Term 1 · 2026/27', issued: '2026-08-18', due: '2026-09-30', amount: amount, paid: paid,
      lines: [{ label: 'Tuition — ' + programmes.find(function (p) { return p.id === st.programmeId; }).short, amount: termFee[st.programmeId] }].concat(st.boarding ? [{ label: 'Boarding & meals', amount: boardingFee }] : []) };
    invoices.push(inv);
    if (paid > 0) {
      var parts = paid === amount && rnd() < 0.4 ? 2 : 1;
      var rem = paid;
      for (var k = 0; k < parts; k++) {
        var amt = k === parts - 1 ? rem : Math.round(paid * 0.5 / 50) * 50;
        rem -= amt;
        var d = '2026-' + pad(int(8, 10), 2) + '-' + pad(int(1, 28), 2);
        payments.push({ id: 'PAY-' + pad(payNo++, 5), invoiceId: inv.id, studentId: st.id, amount: amt, date: d, method: pick(methods),
          reference: 'GCB' + int(100000, 999999), source: 'Finance office', verification: 'Verified',
          qb: rnd() < 0.9 ? 'Recorded' : 'Pending sync', verifiedBy: 'EMP-0022' });
      }
    }
  });
  // Prior-term arrears for a few (affects receivables ageing)
  invoices.forEach(function (inv, i) { if (inv.paid === 0 && i % 3 === 0) inv.arrears = Math.round(between(1200, 4800) / 50) * 50; });
  // Spread a share of late-October receipts into November month-to-date (deterministic)
  payments.forEach(function (p, i) { if (p.date >= '2026-10-15' && i % 3 === 0) p.date = '2026-11-' + pad(2 + (i % 9), 2); });
  // Parent-submitted payment proofs awaiting finance verification
  var pendingSubs = [
    ['STU-0047', 3000, 'Mobile Money', 'MTN-MM 7731928456', '2026-11-09', 'momo-receipt-yaw-adjei.jpg'],
    ['STU-0088', 2500, 'Bank deposit', 'ECO-55102938', '2026-11-08', 'ecobank-slip-0811.pdf'],
    ['STU-0140', 6800, 'Bank transfer', 'SCB-TRF-2026110744', '2026-11-07', 'transfer-confirmation.pdf'],
    ['STU-0215', 4000, 'Bank transfer', 'ABSA-91820374', '2026-11-10', 'absa-transfer.png'],
    ['STU-0301', 1500, 'Mobile Money', 'TCash-0029184', '2026-11-10', 'telecel-cash-receipt.jpg']
  ];
  pendingSubs.forEach(function (p) {
    var inv = invoices.find(function (x) { return x.studentId === p[0]; });
    if (inv.paid + p[1] > inv.amount) inv.paid = Math.max(0, inv.amount - p[1] - 500);
    payments.push({ id: 'PAY-' + pad(payNo++, 5), invoiceId: inv.id, studentId: p[0], amount: p[1], date: p[4], method: p[2], reference: p[3],
      source: 'Parent portal', proof: p[5], verification: 'Pending', qb: 'Not recorded', submittedBy: students.find(function (s) { return s.id === p[0]; }).guardianId });
  });

  // ---------- Budgets FY 2026/27 (Sept–Aug), GHS illustrative ----------
  var YTD_PHASE = 0.21; // ~2.5 months elapsed
  var budgets = [
    { id: 'CC-ACAD', dept: 'Academics & Curriculum', owner: 'EMP-0003', budget: 1850000, actual: 402300, committed: 64000 },
    { id: 'CC-BOARD', dept: 'Boarding', owner: 'EMP-0008', budget: 620000, actual: 141900, committed: 12500 },
    { id: 'CC-KITCH', dept: 'Kitchen & Catering', owner: 'EMP-0009', budget: 940000, actual: 231700, committed: 38200 },
    { id: 'CC-FAC', dept: 'Facilities & Maintenance', owner: 'EMP-0007', budget: 780000, actual: 196400, committed: 71000 },
    { id: 'CC-ICT', dept: 'ICT & Digital', owner: 'EMP-0018', budget: 410000, actual: 61800, committed: 95000 },
    { id: 'CC-HR', dept: 'HR & Staff Development', owner: 'EMP-0005', budget: 260000, actual: 49100, committed: 18000 },
    { id: 'CC-ADMIN', dept: 'Administration', owner: 'EMP-0002', budget: 520000, actual: 104600, committed: 9800 },
    { id: 'CC-SEC', dept: 'Security', owner: 'EMP-0010', budget: 300000, actual: 63200, committed: 4000 },
    { id: 'CC-HEALTH', dept: 'Health Services', owner: 'EMP-0011', budget: 140000, actual: 27900, committed: 3500 },
    { id: 'CC-ECA', dept: 'Extra-Curricular & Sports', owner: 'EMP-0020', budget: 230000, actual: 38600, committed: 22000 }
  ];
  budgets.forEach(function (b) { b.plan = Math.round(b.budget * YTD_PHASE / 100) * 100; });

  // ---------- Admissions ----------
  var admStages = ['New', 'Review', 'Assessment', 'Approved', 'Enrolled', 'Rejected'];
  var admDefs = [
    // name, gender, programme, targetClass, stage, score, boarding, previous school, submitted, entry, source
    ['Nana Akua Frimpong', 'Female', 'IBDP', 'CLS-DP1', 'Assessment', 82, true, 'Ghana International School', '2026-10-12', 'Term 2 · Jan 2027', 'Website'],
    ['Kwesi Mensah-Bonsu', 'Male', 'CAM', 'CLS-IG9', 'Assessment', 74, false, 'Holy Child Preparatory, Cape Coast', '2026-10-15', 'Term 2 · Jan 2027', 'Referral'],
    ['Esi Arthur', 'Female', 'GES-S', 'CLS-SHS1S', 'Assessment', 68, true, 'Winneba Methodist JHS', '2026-10-18', 'Term 2 · Jan 2027', 'Open day'],
    ['Delali Agbeko', 'Male', 'GES-B', 'CLS-JHS1A', 'Assessment', 71, false, 'St. Mary’s Basic, Swedru', '2026-10-20', 'Term 2 · Jan 2027', 'Website'],
    ['Abigail Owusu-Ansah', 'Female', 'CAM', 'CLS-IG10', 'Review', null, true, 'Lincoln Community School (transfer)', '2026-10-28', 'Term 2 · Jan 2027', 'Website'],
    ['Joshua Antwi', 'Male', 'GES-B', 'CLS-B5', 'Review', null, false, 'Agona Swedru Model School', '2026-10-30', 'Term 2 · Jan 2027', 'Referral'],
    ['Selorm Fiagbe', 'Male', 'IBDP', 'CLS-DP1', 'Review', null, true, 'Achimota School', '2026-11-02', 'Sept 2027', 'Website'],
    ['Maame Esi Koomson', 'Female', 'GES-B', 'CLS-B4', 'Review', null, false, 'Kasoa Christian Academy', '2026-11-03', 'Term 2 · Jan 2027', 'Walk-in'],
    ['Caleb Ampofo', 'Male', 'CAM', 'CLS-IG9', 'New', null, false, 'Swedru Preparatory', '2026-11-06', 'Sept 2027', 'Website'],
    ['Elikem Dogbe', 'Female', 'GES-S', 'CLS-SHS1S', 'New', null, true, 'Ho International JHS', '2026-11-07', 'Sept 2027', 'Open day'],
    ['Kobina Eshun', 'Male', 'GES-B', 'CLS-JHS1B', 'New', null, false, 'Mankessim Methodist', '2026-11-09', 'Term 2 · Jan 2027', 'Website'],
    ['Ohemaa Asamoah', 'Female', 'IBDP', 'CLS-DP1', 'New', null, true, 'SOS Hermann Gmeiner International', '2026-11-10', 'Sept 2027', 'Referral'],
    ['Fiifi Quansah', 'Male', 'GES-S', 'CLS-SHS1S', 'New', null, true, 'Winneba Secondary JHS', '2026-11-10', 'Sept 2027', 'Website'],
    ['Adjoa Bekoe', 'Female', 'CAM', 'CLS-AS12', 'Approved', 79, true, 'Wesley Girls’ High School', '2026-09-22', 'Term 2 · Jan 2027', 'Referral'],
    ['Nathaniel Wiredu', 'Male', 'GES-B', 'CLS-JHS2B', 'Approved', 66, false, 'Agona Nyakrom Basic', '2026-09-28', 'Term 2 · Jan 2027', 'Walk-in'],
    ['Serwaa Amponsah', 'Female', 'GES-B', 'CLS-B6', 'Approved', 72, false, 'Swedru Preparatory', '2026-10-01', 'Term 2 · Jan 2027', 'Website'],
    ['Kelvin Acquah', 'Male', 'CAM', 'CLS-IG10', 'Enrolled', 77, true, 'Cape Coast International', '2026-08-14', 'Term 1 · Sept 2026', 'Website'],
    ['Sedinam Agyei', 'Female', 'IBDP', 'CLS-DP1', 'Enrolled', 85, true, 'Mfantsipim (transfer)', '2026-08-05', 'Term 1 · Sept 2026', 'Referral'],
    ['Edem Kumi', 'Male', 'GES-B', 'CLS-JHS1A', 'Enrolled', 69, false, 'Swedru Methodist', '2026-08-20', 'Term 1 · Sept 2026', 'Open day'],
    ['Vanessa Badu', 'Female', 'GES-S', 'CLS-SHS1S', 'Enrolled', 73, true, 'Holy Child JHS', '2026-08-11', 'Term 1 · Sept 2026', 'Website'],
    ['Godwin Adomako', 'Male', 'CAM', 'CLS-IG9', 'Rejected', 41, false, 'Kasoa Excellence Academy', '2026-09-30', 'Term 2 · Jan 2027', 'Website'],
    ['Rita Danquah', 'Female', 'IBDP', 'CLS-DP1', 'Rejected', 55, true, 'Takoradi International', '2026-10-04', 'Sept 2027', 'Website'],
    ['Dennis Ocran', 'Male', 'GES-S', 'CLS-SHS2S', 'Rejected', null, false, 'Winneba SHS (transfer)', '2026-10-09', 'Term 2 · Jan 2027', 'Walk-in']
  ];
  var admissions = admDefs.map(function (a, i) {
    var id = 'ADM-26' + pad(31 + i, 3);
    var gLast = a[0].split(' ').slice(-1)[0];
    var gFirst = pick(['Charles', 'Gifty', 'Francis', 'Mercy', 'Peter', 'Joyce', 'Stephen', 'Evelyn']);
    var stageIdx = admStages.indexOf(a[4]);
    var docs = [
      { name: 'Birth certificate', ok: true },
      { name: 'Previous school report (2 terms)', ok: stageIdx >= 1 || i % 2 === 0 },
      { name: 'Transfer / recommendation letter', ok: stageIdx >= 2 || i % 3 === 0 },
      { name: 'Passport photographs', ok: true },
      { name: 'Medical clearance form', ok: stageIdx >= 3 }
    ];
    var tl = [{ date: a[8], title: 'Application submitted', by: 'Online portal', note: 'Source: ' + a[10] }];
    if (stageIdx >= 1 && a[4] !== 'Rejected' || (a[4] === 'Rejected' && a[5] !== null)) tl.push({ date: shiftDate(a[8], 3), title: 'Moved to Under review', by: 'Naa Dedei Ankrah' });
    if (a[5] !== null) tl.push({ date: shiftDate(a[8], 10), title: 'Entrance assessment & interview completed', by: 'Admissions panel', note: 'Assessment score: ' + a[5] + '%' });
    if (a[4] === 'Approved' || a[4] === 'Enrolled') tl.push({ date: shiftDate(a[8], 16), title: 'Admission approved', by: 'Dr. Abena Owusu-Mensah' });
    if (a[4] === 'Enrolled') tl.push({ date: shiftDate(a[8], 24), title: 'Enrolled — student record created', by: 'Kwame Asante' });
    if (a[4] === 'Rejected') tl.push({ date: shiftDate(a[8], 14), title: a[5] === null ? 'Application deferred to Sept 2027 intake' : 'Application not successful', by: 'Admissions panel' });
    return {
      id: id, name: a[0], gender: a[1], programmeId: a[2], targetClass: a[3], stage: a[4], score: a[5], boarding: a[6], previousSchool: a[7],
      submitted: a[8], entry: a[9], source: a[10], dob: (2026 - classById[a[3]].age) + '-' + pad(int(1, 12), 2) + '-' + pad(int(1, 28), 2),
      guardian: { name: gFirst + ' ' + gLast, relation: ['Gifty', 'Mercy', 'Joyce', 'Evelyn'].indexOf(gFirst) > -1 ? 'Mother' : 'Father', phone: phone(), email: emailOf(gFirst + ' ' + gLast) },
      docs: docs, interview: a[5] !== null ? shiftDate(a[8], 10) : (a[4] === 'Review' ? shiftDate('2026-11-11', 6 + i % 5) : null),
      notes: a[4] === 'Assessment' ? 'Assessment and interview completed. Panel recommends admission; awaiting Head of School decision.' : '',
      timeline: tl, studentId: null
    };
  });
  // enrolled admissions map to student records
  ['ADM-26047', 'ADM-26048', 'ADM-26049', 'ADM-26050'].forEach(function (id, k) {
    var a = admissions.find(function (x) { return x.id === id; });
    if (!a) return;
    a.studentId = 'STU-0' + (380 + k * 4);
    var parts = a.name.split(' ');
    var st = story(a.studentId, { first: parts[0], last: parts.slice(1).join(' '), name: a.name, gender: a.gender, classId: a.targetClass, programmeId: a.programmeId, boarding: a.boarding, admitted: '2026-09-07', house: a.gender === 'Female' ? 'Ankobra' : 'Pra' });
    var par = parents.find(function (p) { return p.id === st.guardianId; });
    if (par) { var gp = a.guardian.name.split(' '); par.first = gp[0]; par.last = gp.slice(1).join(' '); par.name = a.guardian.name; par.relation = a.guardian.relation; par.title = a.guardian.relation === 'Mother' ? 'Mrs.' : 'Mr.'; par.phone = a.guardian.phone; par.email = a.guardian.email; }
    var inv = invoices.find(function (x) { return x.studentId === st.id; });
    if (inv) {
      inv.amount = termFee[st.programmeId] + (st.boarding ? boardingFee : 0);
      inv.lines = [{ label: 'Tuition — ' + programmes.find(function (p) { return p.id === st.programmeId; }).short, amount: termFee[st.programmeId] }].concat(st.boarding ? [{ label: 'Boarding & meals', amount: boardingFee }] : []);
      inv.paid = inv.amount;
      payments.forEach(function (p) { if (p.invoiceId === inv.id) p.amount = 0; });
      var first = payments.find(function (p) { return p.invoiceId === inv.id; });
      if (first) first.amount = inv.amount;
      else payments.push({ id: 'PAY-' + pad(payNo++, 5), invoiceId: inv.id, studentId: st.id, amount: inv.amount, date: '2026-09-02', method: 'Bank transfer', reference: 'GCB' + int(100000, 999999), source: 'Finance office', verification: 'Verified', qb: 'Recorded', verifiedBy: 'EMP-0022' });
    }
  });
  payments = payments.filter(function (p) { return p.amount > 0; });

  function shiftDate(d, days) { var t = new Date(d + 'T00:00:00'); t.setDate(t.getDate() + days); return t.toISOString().slice(0, 10); }

  // ---------- HR leave ----------
  var leaves = [
    { id: 'LV-2611', empId: 'EMP-0031', type: 'Study leave', from: '2026-11-23', to: '2026-11-27', days: 5, reason: 'Final examinations — M.Ed. Educational Leadership (UCC)', status: 'Pending', submitted: '2026-11-04' },
    { id: 'LV-2612', empId: 'EMP-0016', type: 'Annual leave', from: '2026-12-14', to: '2026-12-24', days: 8, reason: 'Family travel — end of term', status: 'Pending', submitted: '2026-11-06' },
    { id: 'LV-2613', empId: 'EMP-0041', type: 'Sick leave', from: '2026-11-09', to: '2026-11-11', days: 3, reason: 'Medical certificate attached', status: 'Approved', submitted: '2026-11-09' },
    { id: 'LV-2614', empId: 'EMP-0026', type: 'Compassionate leave', from: '2026-11-16', to: '2026-11-18', days: 3, reason: 'Bereavement — family funeral (Mankessim)', status: 'Pending', submitted: '2026-11-10' },
    { id: 'LV-2615', empId: 'EMP-0036', type: 'Maternity leave', from: '2027-01-11', to: '2027-04-02', days: 60, reason: 'Statutory maternity leave', status: 'Approved', submitted: '2026-10-20' },
    { id: 'LV-2616', empId: 'EMP-0029', type: 'Annual leave', from: '2026-12-21', to: '2027-01-04', days: 7, reason: 'Christmas break travel', status: 'Rejected', submitted: '2026-10-29', note: 'Conflicts with IB DP2 mock invigilation rota' }
  ];

  // ---------- Maintenance ----------
  var maintenance = [
    { id: 'MR-0418', title: 'Water leakage in Densu House washrooms', location: 'Densu House · Block 2 washrooms', category: 'Plumbing', priority: 'High', status: 'Open', reportedBy: 'EMP-0008', reported: '2026-11-10', assignee: null, description: 'Persistent leakage from two overhead pipes; floor wet throughout the morning. Risk of slips for boarders. Mains valve partially closed as interim measure.' },
    { id: 'MR-0417', title: 'Science lab fume cupboard extractor not working', location: 'Block C · Chemistry Lab', category: 'Electrical', priority: 'Critical', status: 'Assigned', reportedBy: 'EMP-0034', reported: '2026-11-09', assignee: 'EMP-0015', description: 'Extractor fan in fume cupboard 2 not running. Chemistry practicals for SHS 2 Science and IB DP1 suspended until resolved.' },
    { id: 'MR-0416', title: 'Projector failure — IB Centre E02', location: 'IB Centre · E02', category: 'ICT', priority: 'Medium', status: 'In progress', reportedBy: 'EMP-0012', reported: '2026-11-07', assignee: 'EMP-0018', description: 'Ceiling projector shows no signal on HDMI. Replacement lamp ordered.' },
    { id: 'MR-0415', title: 'Broken louvre blades — JHS 2B classroom', location: 'Block B · B22', category: 'Carpentry', priority: 'Medium', status: 'Open', reportedBy: 'EMP-0033', reported: '2026-11-06', assignee: null, description: 'Four louvre blades broken on the window facing the courtyard. Rain enters during afternoon showers.' },
    { id: 'MR-0414', title: 'Kitchen cold room temperature alarm', location: 'Kitchen · Cold room', category: 'Electrical', priority: 'High', status: 'In progress', reportedBy: 'EMP-0009', reported: '2026-11-05', assignee: 'EMP-0015', description: 'Cold room reading 9°C (target 2–4°C). Compressor servicing contractor contacted; perishables moved to backup freezers.' },
    { id: 'MR-0413', title: 'Football pitch irrigation pump', location: 'Sports field', category: 'Grounds', priority: 'Low', status: 'Open', reportedBy: 'EMP-0020', reported: '2026-11-04', assignee: null, description: 'Irrigation pump trips after 10 minutes. Inter-house sports scheduled 28 Nov.' },
    { id: 'MR-0412', title: 'Wi-Fi access point offline — Library', location: 'Library · Reading room', category: 'ICT', priority: 'Medium', status: 'Assigned', reportedBy: 'EMP-0021', reported: '2026-11-03', assignee: 'EMP-0018', description: 'AP-LIB-02 offline; students unable to access e-library resources from the reading room.' },
    { id: 'MR-0411', title: 'Repaint Basic 4 classroom', location: 'Block A · A04', category: 'Painting', priority: 'Low', status: 'Open', reportedBy: 'EMP-0002', reported: '2026-10-30', assignee: null, description: 'Scheduled refresh before Term 2. Low-VOC paint to be used.' },
    { id: 'MR-0410', title: 'Faulty ceiling fans — Volta House dorm', location: 'Volta House · Dorm B', category: 'Electrical', priority: 'High', status: 'Completed', reportedBy: 'EMP-0020', reported: '2026-10-27', assignee: 'EMP-0015', completed: '2026-10-29', resolution: 'Replaced two capacitors and one regulator. All 6 fans tested OK.', description: 'Three of six fans not working.' },
    { id: 'MR-0409', title: 'Blocked drain — Dining hall', location: 'Dining hall · rear', category: 'Plumbing', priority: 'Medium', status: 'Completed', reportedBy: 'EMP-0009', reported: '2026-10-24', assignee: 'EMP-0016', completed: '2026-10-25', resolution: 'Drain cleared and grease trap serviced.', description: 'Slow drainage and odour near the wash bay.' },
    { id: 'MR-0408', title: 'Door lock replacement — Exams store', location: 'Admin block · Exams store', category: 'Carpentry', priority: 'High', status: 'Completed', reportedBy: 'EMP-0003', reported: '2026-10-21', assignee: 'EMP-0017', completed: '2026-10-22', resolution: 'Installed new mortice lock; 2 keys issued to Deputy Head (Academics).', description: 'Lock mechanism jammed.' },
    { id: 'MR-0407', title: 'Generator service — 250 kVA', location: 'Power house', category: 'Electrical', priority: 'Medium', status: 'Completed', reportedBy: 'EMP-0007', reported: '2026-10-15', assignee: 'EMP-0015', completed: '2026-10-19', resolution: 'Routine 500-hour service completed by contractor; oil and filters changed.', description: 'Scheduled maintenance.' }
  ];
  maintenance.forEach(function (m) {
    m.timeline = [{ date: m.reported, title: 'Request logged', by: (employees.find(function (e) { return e.id === m.reportedBy; }) || {}).shortName || 'Staff' }];
    if (m.assignee) m.timeline.push({ date: shiftDate(m.reported, 1 > 0 ? 0 : 0), title: 'Assigned to ' + employees.find(function (e) { return e.id === m.assignee; }).shortName, by: 'Ebo Hagan' });
    if (m.status === 'In progress' || m.status === 'Completed') m.timeline.push({ date: shiftDate(m.reported, 1), title: 'Work started', by: employees.find(function (e) { return e.id === m.assignee; }).shortName });
    if (m.status === 'Completed') m.timeline.push({ date: m.completed, title: 'Marked completed', by: 'Ebo Hagan', note: m.resolution });
  });

  // ---------- Boarding ----------
  var boardingHouses = [
    { id: 'Volta', name: 'Volta House', gender: 'Boys', capacity: 44, masterId: 'EMP-0020', dorms: 3 },
    { id: 'Pra', name: 'Pra House', gender: 'Boys', capacity: 36, masterId: 'EMP-0020', dorms: 3 },
    { id: 'Ankobra', name: 'Ankobra House', gender: 'Girls', capacity: 44, masterId: 'EMP-0008', dorms: 3 },
    { id: 'Densu', name: 'Densu House', gender: 'Girls', capacity: 32, masterId: 'EMP-0008', dorms: 3 }
  ];
  var exeats = [
    { id: 'EX-1107', studentId: 'STU-0047', type: 'Weekend exeat', from: '2026-11-13', to: '2026-11-15', reason: 'Family event — grandmother’s 80th birthday', guardianConsent: true, status: 'Pending' },
    { id: 'EX-1106', studentId: null, type: 'Medical appointment', from: '2026-11-12', to: '2026-11-12', reason: 'Dental appointment — Swedru Government Hospital', guardianConsent: true, status: 'Pending' },
    { id: 'EX-1105', studentId: null, type: 'Weekend exeat', from: '2026-11-13', to: '2026-11-15', reason: 'Family visit — Accra', guardianConsent: true, status: 'Pending' },
    { id: 'EX-1104', studentId: null, type: 'Weekend exeat', from: '2026-11-06', to: '2026-11-08', reason: 'Church confirmation service', guardianConsent: true, status: 'Approved' },
    { id: 'EX-1103', studentId: null, type: 'Emergency', from: '2026-11-03', to: '2026-11-05', reason: 'Family emergency', guardianConsent: true, status: 'Approved' }
  ];
  var boarders = students.filter(function (s) { return s.boarding && s.id !== 'STU-0047'; });
  exeats.forEach(function (x, i) { if (!x.studentId) x.studentId = boarders[(i * 17) % boarders.length].id; });

  // ---------- Kitchen ----------
  var menu = [
    { day: 'Monday', breakfast: 'Hausa koko, bread & boiled egg', lunch: 'Jollof rice with grilled chicken & salad', supper: 'Banku with tilapia & pepper sauce' },
    { day: 'Tuesday', breakfast: 'Oats, bread & sliced fruit', lunch: 'Red-red (beans stew) with fried plantain', supper: 'Fried rice with chicken & coleslaw' },
    { day: 'Wednesday', breakfast: 'Tom Brown porridge & toast', lunch: 'Waakye with egg, fish & shito', supper: 'Yam with garden egg stew' },
    { day: 'Thursday', breakfast: 'Rice water, bread & omelette', lunch: 'Ampesi with kontomire stew', supper: 'Kenkey with fried fish & pepper' },
    { day: 'Friday', breakfast: 'Koko, bread & groundnuts', lunch: 'Plain rice with palava sauce', supper: 'Spaghetti with beef sauce' },
    { day: 'Saturday', breakfast: 'Tea, bread & fried egg', lunch: 'Rice balls with groundnut soup', supper: 'Gari & beans (gob3) with plantain' },
    { day: 'Sunday', breakfast: 'Cocoa drink, bread & sausage', lunch: 'Fufu with light soup & goat meat', supper: 'Jollof rice with fish & salad' }
  ];
  var inventory = [
    { id: 'INV-K01', item: 'Rice (perfumed, 50 kg)', category: 'Grains', unit: 'bags', stock: 14, reorder: 10, dailyUse: 2.2, supplier: 'Agona Wholesale Foods' },
    { id: 'INV-K02', item: 'Maize flour', category: 'Grains', unit: 'bags', stock: 6, reorder: 8, dailyUse: 1.1, supplier: 'Swedru Grain Market' },
    { id: 'INV-K03', item: 'Vegetable oil (25 L)', category: 'Oils', unit: 'gallons', stock: 9, reorder: 6, dailyUse: 0.8, supplier: 'Agona Wholesale Foods' },
    { id: 'INV-K04', item: 'Chicken (frozen)', category: 'Protein', unit: 'cartons', stock: 4, reorder: 6, dailyUse: 1.5, supplier: 'Coastal Cold Stores' },
    { id: 'INV-K05', item: 'Tilapia (frozen)', category: 'Protein', unit: 'cartons', stock: 7, reorder: 5, dailyUse: 0.9, supplier: 'Coastal Cold Stores' },
    { id: 'INV-K06', item: 'Eggs', category: 'Protein', unit: 'crates', stock: 22, reorder: 15, dailyUse: 6, supplier: 'Gomoa Poultry Farm' },
    { id: 'INV-K07', item: 'Tomatoes (fresh)', category: 'Vegetables', unit: 'boxes', stock: 3, reorder: 5, dailyUse: 1.8, supplier: 'Mankessim Market' },
    { id: 'INV-K08', item: 'Onions', category: 'Vegetables', unit: 'bags', stock: 5, reorder: 3, dailyUse: 0.6, supplier: 'Mankessim Market' },
    { id: 'INV-K09', item: 'Beans (black-eyed)', category: 'Grains', unit: 'bags', stock: 8, reorder: 4, dailyUse: 0.5, supplier: 'Swedru Grain Market' },
    { id: 'INV-K10', item: 'Plantain', category: 'Vegetables', unit: 'bunches', stock: 30, reorder: 25, dailyUse: 9, supplier: 'Local farmers co-op' },
    { id: 'INV-K11', item: 'Bread (loaves)', category: 'Bakery', unit: 'loaves', stock: 120, reorder: 150, dailyUse: 160, supplier: 'Swedru Bakery' },
    { id: 'INV-K12', item: 'Milk powder (2.5 kg)', category: 'Dairy', unit: 'tins', stock: 11, reorder: 8, dailyUse: 1.2, supplier: 'Agona Wholesale Foods' },
    { id: 'INV-K13', item: 'Cooking gas (LPG)', category: 'Utilities', unit: 'cylinders (50 kg)', stock: 3, reorder: 2, dailyUse: 0.4, supplier: 'GOIL LPG' }
  ];
  var kitchenWeekly = [
    { week: 'Wk 5', meals: 3120, wasteKg: 212 }, { week: 'Wk 6', meals: 3165, wasteKg: 198 }, { week: 'Wk 7', meals: 3080, wasteKg: 225 },
    { week: 'Wk 8', meals: 3190, wasteKg: 181 }, { week: 'Wk 9', meals: 3205, wasteKg: 174 }, { week: 'Wk 10', meals: 3150, wasteKg: 166 }
  ];

  // ---------- Security & reception ----------
  var visitors = [
    { id: 'VIS-3381', name: 'Mr. Charles Mensah-Bonsu', purpose: 'Admissions interview (parent)', hostId: 'EMP-0006', timeIn: '08:42', timeOut: null, badge: 'V-07', idType: 'Ghana Card' },
    { id: 'VIS-3380', name: 'Coastal Cold Stores — delivery', purpose: 'Kitchen supplies delivery', hostId: 'EMP-0009', timeIn: '08:15', timeOut: '08:58', badge: 'C-02', idType: 'Company ID' },
    { id: 'VIS-3379', name: 'Mrs. Gifty Antwi', purpose: 'Meeting — Class Teacher, Basic 5', hostId: 'EMP-0055', timeIn: '07:55', timeOut: null, badge: 'V-06', idType: 'Ghana Card' },
    { id: 'VIS-3378', name: 'GES District Officer', purpose: 'Routine inspection visit', hostId: 'EMP-0003', timeIn: '07:48', timeOut: null, badge: 'O-01', idType: 'Official ID' },
    { id: 'VIS-3377', name: 'Electro-Volt Services', purpose: 'Cold room compressor servicing', hostId: 'EMP-0007', timeIn: '07:30', timeOut: null, badge: 'C-01', idType: 'Company ID' },
    { id: 'VIS-3376', name: 'Mr. Peter Quansah', purpose: 'Fee enquiry — Finance office', hostId: 'EMP-0022', timeIn: '07:22', timeOut: '07:51', badge: 'V-05', idType: 'Driver’s licence' }
  ];
  var incidents = [
    { id: 'INC-0091', date: '2026-11-09', type: 'Perimeter', location: 'North fence (sports field)', severity: 'Medium', status: 'Under review', summary: 'Section of fence damaged by fallen tree branch. Temporary barrier installed; repair request raised.' },
    { id: 'INC-0090', date: '2026-11-04', type: 'Access control', location: 'Main gate', severity: 'Low', status: 'Closed', summary: 'Visitor arrived without appointment; redirected to reception, appointment rescheduled.' },
    { id: 'INC-0089', date: '2026-10-29', type: 'Property', location: 'Volta House', severity: 'Low', status: 'Closed', summary: 'Reported misplaced calculator located in common room. No further action.' },
    { id: 'INC-0088', date: '2026-10-22', type: 'Safety', location: 'Dining hall', severity: 'Medium', status: 'Closed', summary: 'Wet floor slip (no injury). Signage added; drainage request logged (MR-0409).' }
  ];

  // ---------- Infirmary (aggregate only — no individual medical records) ----------
  var infirmary = {
    weekly: [{ week: 'Wk 5', visits: 41 }, { week: 'Wk 6', visits: 38 }, { week: 'Wk 7', visits: 52 }, { week: 'Wk 8', visits: 47 }, { week: 'Wk 9', visits: 36 }, { week: 'Wk 10', visits: 33 }],
    categories: [{ label: 'Headache / fever', value: 31 }, { label: 'Minor injuries', value: 24 }, { label: 'Stomach upset', value: 17 }, { label: 'Respiratory', value: 14 }, { label: 'Routine medication', value: 21 }],
    referrals: 3, admittedOvernight: 1, staffOnDuty: 2
  };

  // ---------- Governance ----------
  var meetings = [
    { id: 'BM-2026-06', date: '2026-12-03', title: 'Full Board Meeting — Q2 FY 2026/27', type: 'Full Board', status: 'Scheduled', venue: 'Board Room, Admin Block', agenda: ['Head of School report — Term 1', 'Finance Committee report & receivables', 'Strategic Plan 2025–2029: Year 2 progress', 'Science Block refurbishment — funding approval', 'Safeguarding policy review'], papersReady: 3 },
    { id: 'FC-2026-05', date: '2026-11-19', title: 'Finance & Audit Committee', type: 'Committee', status: 'Scheduled', venue: 'Virtual (Google Meet)', agenda: ['Fee collection & receivables ageing', 'Budget variance — Q1', 'Internal audit findings: procurement', 'QuickBooks reconciliation status'], papersReady: 2 },
    { id: 'AC-2026-04', date: '2026-10-22', title: 'Academic Committee', type: 'Committee', status: 'Minutes approved', venue: 'Board Room', agenda: ['WASSCE & IB results 2026', 'Learning support (7+1 model) review', 'Cambridge A-Level expansion'], papersReady: 3 },
    { id: 'BM-2026-05', date: '2026-09-10', title: 'Full Board Meeting — Q1 FY 2026/27', type: 'Full Board', status: 'Minutes approved', venue: 'Board Room', agenda: ['Annual budget FY 2026/27 approval', 'Staffing plan', 'Strategic plan Year 2 priorities'], papersReady: 3 }
  ];
  var resolutions = [
    { id: 'RES-2026-14', title: 'Approve FY 2026/27 operating budget of GHS 6.05m', meetingId: 'BM-2026-05', date: '2026-09-10', status: 'Implemented' },
    { id: 'RES-2026-15', title: 'Commission Science Block refurbishment feasibility study', meetingId: 'BM-2026-05', date: '2026-09-10', status: 'In progress' },
    { id: 'RES-2026-16', title: 'Adopt revised Fee Payment & Arrears Policy', meetingId: 'BM-2026-05', date: '2026-09-10', status: 'In progress' },
    { id: 'RES-2026-17', title: 'Expand 7+1 learning support model to Cambridge Year 9–10', meetingId: 'AC-2026-04', date: '2026-10-22', status: 'In progress' },
    { id: 'RES-2026-18', title: 'Approve integrated school management system (MICSAPP) business case', meetingId: 'BM-2026-05', date: '2026-09-10', status: 'In progress' },
    { id: 'RES-2026-13', title: 'Appoint external auditor for FY 2025/26 statements', meetingId: 'BM-2026-04', date: '2026-06-18', status: 'Implemented' }
  ];
  var actions = [
    { id: 'ACT-031', title: 'Present receivables recovery plan for accounts > 60 days', ownerId: 'EMP-0004', due: '2026-11-19', status: 'In progress', progress: 60, resolutionId: 'RES-2026-16', priority: 'High' },
    { id: 'ACT-032', title: 'Science Block refurbishment — obtain three contractor quotations', ownerId: 'EMP-0007', due: '2026-11-28', status: 'In progress', progress: 35, resolutionId: 'RES-2026-15', priority: 'High' },
    { id: 'ACT-033', title: 'Circulate revised Safeguarding Policy draft to Board members', ownerId: 'EMP-0003', due: '2026-11-20', status: 'Not started', progress: 0, resolutionId: null, priority: 'Medium' },
    { id: 'ACT-034', title: 'Report on 7+1 model pilot outcomes — Cambridge Year 9', ownerId: 'EMP-0013', due: '2026-12-03', status: 'In progress', progress: 45, resolutionId: 'RES-2026-17', priority: 'Medium' },
    { id: 'ACT-035', title: 'Finalise MICSAPP implementation scope and data migration plan', ownerId: 'EMP-0002', due: '2026-11-30', status: 'In progress', progress: 70, resolutionId: 'RES-2026-18', priority: 'High' },
    { id: 'ACT-029', title: 'Staff appraisal cycle: complete manager reviews', ownerId: 'EMP-0005', due: '2026-11-06', status: 'In progress', progress: 72, resolutionId: null, priority: 'Medium' },
    { id: 'ACT-027', title: 'Fire safety audit across boarding houses', ownerId: 'EMP-0010', due: '2026-10-30', status: 'Completed', progress: 100, resolutionId: null, priority: 'High' }
  ];
  actions.forEach(function (a) { a.updates = [{ date: '2026-10-' + pad(10 + (a.progress % 17), 2), by: (employees.find(function (e) { return e.id === a.ownerId; }) || {}).shortName, text: a.status === 'Completed' ? 'Action completed and evidence filed.' : a.progress > 0 ? 'Progress update: ' + a.progress + '% complete.' : 'Action assigned.' }]; });

  var strategicPlan = [
    { id: 'P1', pillar: 'Academic Excellence & Learning Innovation', owner: 'EMP-0003', objectives: [
      { name: 'Raise WASSCE/IGCSE A–C pass rates year-on-year', progress: 46, rag: 'g' },
      { name: 'Embed the 7+1 learning model across all programmes', progress: 38, rag: 'a' },
      { name: 'Introduce Cambridge A-Level pathway (full)', progress: 55, rag: 'g' },
      { name: 'Digital learning resources for every subject', progress: 31, rag: 'a' } ] },
    { id: 'P2', pillar: 'Student Wellbeing & Holistic Development', owner: 'EMP-0008', objectives: [
      { name: 'Student wellbeing & counselling framework', progress: 52, rag: 'g' },
      { name: 'Expand co-curricular participation to 85% of students', progress: 44, rag: 'g' },
      { name: 'Career counselling for SHS / DP students', progress: 40, rag: 'g' } ] },
    { id: 'P3', pillar: 'Faculty Development & Talent', owner: 'EMP-0005', objectives: [
      { name: 'Annual appraisal completion for all staff', progress: 61, rag: 'g' },
      { name: 'IB/Cambridge certification for subject leads', progress: 33, rag: 'a' },
      { name: 'Staff retention above target', progress: 48, rag: 'g' } ] },
    { id: 'P4', pillar: 'Infrastructure & Digital Transformation', owner: 'EMP-0002', objectives: [
      { name: 'Integrated school management system (MICSAPP)', progress: 22, rag: 'a' },
      { name: 'Science Block refurbishment', progress: 12, rag: 'r' },
      { name: 'Campus-wide Wi-Fi coverage', progress: 58, rag: 'g' } ] },
    { id: 'P5', pillar: 'Financial Sustainability & Governance', owner: 'EMP-0004', objectives: [
      { name: 'Fee collection rate ≥ 92% per term', progress: 41, rag: 'a' },
      { name: 'Board governance & policy review cycle', progress: 50, rag: 'g' },
      { name: 'Diversify income (alumni & partnerships)', progress: 18, rag: 'r' } ] }
  ];

  var kpis = [
    { id: 'KPI-01', dept: 'Academics', name: 'Average attainment (all programmes)', target: 70, unit: '%', key: 'avgScore' },
    { id: 'KPI-02', dept: 'Academics', name: 'Student attendance rate', target: 95, unit: '%', key: 'attendance' },
    { id: 'KPI-03', dept: 'Finance', name: 'Term 1 fee collection rate', target: 92, unit: '%', key: 'collection' },
    { id: 'KPI-04', dept: 'HR', name: 'Appraisals completed', target: 100, unit: '%', key: 'appraisals' },
    { id: 'KPI-05', dept: 'Facilities', name: 'Maintenance requests closed within SLA', target: 85, unit: '%', value: 78 },
    { id: 'KPI-06', dept: 'Boarding', name: 'Boarding occupancy', target: 90, unit: '%', key: 'occupancy' },
    { id: 'KPI-07', dept: 'Admissions', name: 'Applications converted to enrolment', target: 60, unit: '%', value: 63 },
    { id: 'KPI-08', dept: 'Catering', name: 'Food waste per meal (g)', target: 60, unit: 'g', value: 53, lowerIsBetter: true }
  ];

  // ---------- Events & announcements ----------
  var events = [
    { id: 'EV-01', date: '2026-11-16', end: '2026-11-20', title: 'Mid-Term Examinations', type: 'Academic', location: 'All classes', audience: 'All' },
    { id: 'EV-02', date: '2026-11-19', title: 'Finance & Audit Committee', type: 'Governance', location: 'Virtual', audience: 'Board' },
    { id: 'EV-03', date: '2026-11-21', title: 'PTA General Meeting', type: 'Community', location: 'Assembly Hall · 10:00', audience: 'Parents' },
    { id: 'EV-04', date: '2026-11-28', title: 'Inter-House Sports Festival', type: 'Sports', location: 'Sports field · 08:00', audience: 'All' },
    { id: 'EV-05', date: '2026-12-03', title: 'Full Board Meeting', type: 'Governance', location: 'Board Room', audience: 'Board' },
    { id: 'EV-06', date: '2026-12-05', title: 'IB DP Creativity, Activity, Service Showcase', type: 'Academic', location: 'IB Centre', audience: 'All' },
    { id: 'EV-07', date: '2026-12-10', title: 'Carols & Lessons Service', type: 'Community', location: 'Assembly Hall · 17:00', audience: 'All' },
    { id: 'EV-08', date: '2026-12-11', title: 'End of Term 1 · Reports issued', type: 'Academic', location: '—', audience: 'All' }
  ];
  var announcements = [
    { id: 'AN-31', date: '2026-11-10', title: 'Mid-term examination timetable published', body: 'The mid-term examination timetable for 16–20 November is now available in the parent portal. Students should arrive by 07:15 each day.', audience: 'Parents & students', authorId: 'EMP-0003' },
    { id: 'AN-30', date: '2026-11-06', title: 'Inter-House Sports Festival — 28 November', body: 'Parents are warmly invited to the annual Inter-House Sports Festival. Gates open at 07:30.', audience: 'All', authorId: 'EMP-0020' },
    { id: 'AN-29', date: '2026-11-02', title: 'Term 1 fee reminder', body: 'Balances for Term 1 were due on 30 September. Please submit payment references through the parent portal for verification.', audience: 'Parents', authorId: 'EMP-0004' },
    { id: 'AN-28', date: '2026-10-27', title: 'PTA General Meeting — 21 November', body: 'Agenda includes the school development update and the new learning support programme.', audience: 'Parents', authorId: 'EMP-0001' }
  ];
  var appointments = [
    { id: 'APT-118', parentId: null, studentId: 'STU-0012', staffId: 'EMP-0014', date: '2026-11-04', slot: '14:00', reason: 'Discuss BECE preparation plan', status: 'Completed', mode: 'In person' }
  ];

  // ---------- Assignments & exams (teacher focus) ----------
  var assignments = [
    { id: 'ASG-551', classId: 'CLS-JHS2A', subject: 'Mathematics', title: 'Linear equations — problem set 4', set: '2026-11-04', due: '2026-11-10', submitted: 24, status: 'Marking' },
    { id: 'ASG-552', classId: 'CLS-JHS2B', subject: 'Mathematics', title: 'Linear equations — problem set 4', set: '2026-11-04', due: '2026-11-10', submitted: 19, status: 'Marking' },
    { id: 'ASG-553', classId: 'CLS-SHS1S', subject: 'Core Mathematics', title: 'Sets & Venn diagrams — investigation', set: '2026-11-06', due: '2026-11-13', submitted: 11, status: 'Open' },
    { id: 'ASG-554', classId: 'CLS-JHS3A', subject: 'Mathematics', title: 'BECE past questions — Paper 2 (2023)', set: '2026-11-09', due: '2026-11-16', submitted: 6, status: 'Open' },
    { id: 'ASG-549', classId: 'CLS-JHS3A', subject: 'Mathematics', title: 'Mensuration — surface area', set: '2026-10-26', due: '2026-11-02', submitted: 28, status: 'Graded' }
  ];
  var exams = [
    { id: 'EX-MT-01', title: 'Mid-Term Examinations', programme: 'All programmes', from: '2026-11-16', to: '2026-11-20', status: 'Scheduled', coordinatorId: 'EMP-0003' },
    { id: 'EX-BM-01', title: 'BECE Mock (JHS 3)', programme: 'GES Basic', from: '2026-12-01', to: '2026-12-04', status: 'Scheduled', coordinatorId: 'EMP-0003' },
    { id: 'EX-IG-01', title: 'IGCSE Year 11 Mock Series', programme: 'Cambridge', from: '2027-01-18', to: '2027-01-29', status: 'Planning', coordinatorId: 'EMP-0013' },
    { id: 'EX-IB-01', title: 'IB DP2 Mock Examinations', programme: 'IBDP', from: '2027-02-08', to: '2027-02-19', status: 'Planning', coordinatorId: 'EMP-0012' },
    { id: 'EX-WA-01', title: 'WASSCE Mock (SHS 3)', programme: 'GES SHS', from: '2027-02-15', to: '2027-02-26', status: 'Planning', coordinatorId: 'EMP-0003' }
  ];
  var examSlots = [
    { date: '2026-11-16', time: '08:00–09:30', classId: 'CLS-JHS2A', subject: 'Mathematics', venue: 'B21', invigilatorId: 'EMP-0014' },
    { date: '2026-11-16', time: '08:00–09:30', classId: 'CLS-JHS2B', subject: 'Mathematics', venue: 'B22', invigilatorId: 'EMP-0033' },
    { date: '2026-11-17', time: '10:00–12:00', classId: 'CLS-SHS1S', subject: 'Core Mathematics', venue: 'C11', invigilatorId: 'EMP-0014' },
    { date: '2026-11-17', time: '08:00–09:30', classId: 'CLS-JHS3A', subject: 'Mathematics', venue: 'B31', invigilatorId: 'EMP-0040' },
    { date: '2026-11-18', time: '08:00–10:00', classId: 'CLS-IG10', subject: 'Mathematics', venue: 'D10', invigilatorId: 'EMP-0028' },
    { date: '2026-11-18', time: '10:30–12:00', classId: 'CLS-JHS2A', subject: 'English Language', venue: 'B21', invigilatorId: 'EMP-0014' },
    { date: '2026-11-19', time: '08:00–10:30', classId: 'CLS-DP1', subject: 'Biology', venue: 'E01', invigilatorId: 'EMP-0012' },
    { date: '2026-11-20', time: '08:00–09:30', classId: 'CLS-JHS2A', subject: 'Integrated Science', venue: 'B21', invigilatorId: 'EMP-0035' }
  ];

  // Teacher timetable (Efua Boateng) — periods
  var periods = [
    { id: 1, time: '07:30 – 08:30' }, { id: 2, time: '08:30 – 09:30' }, { id: 'B', time: '09:30 – 10:00', label: 'Break' },
    { id: 3, time: '10:00 – 11:00' }, { id: 4, time: '11:00 – 12:00' }, { id: 'L', time: '12:00 – 12:45', label: 'Lunch' },
    { id: 5, time: '12:45 – 13:45' }, { id: 6, time: '13:45 – 14:45' }
  ];
  var teacherTimetable = {
    Monday: { 1: 'CLS-JHS2A', 3: 'CLS-SHS1S', 4: 'CLS-JHS3A', 6: 'CLS-JHS2B' },
    Tuesday: { 2: 'CLS-JHS2B', 3: 'CLS-JHS2A', 5: 'CLS-SHS1S' },
    Wednesday: { 1: 'CLS-JHS2A', 3: 'CLS-SHS1S', 5: 'CLS-JHS3A', 6: 'CLS-JHS2B' },
    Thursday: { 1: 'CLS-JHS3A', 2: 'CLS-JHS2A', 4: 'CLS-SHS1S' },
    Friday: { 1: 'CLS-JHS2B', 3: 'CLS-JHS3A', 4: 'CLS-JHS2A', 5: 'CLS-SHS1S' }
  };
  // Attendance registers already taken today (Wednesday): P1 JHS 2A pending to demo
  var registers = [
    { id: 'REG-20261110-JHS2A', classId: 'CLS-JHS2A', date: '2026-11-10', period: 3, takenBy: 'EMP-0014', present: 26, absent: 1, late: 0, excused: 0 },
    { id: 'REG-20261111-JHS2B', classId: 'CLS-JHS2B', date: '2026-11-11', period: 'AM', takenBy: 'EMP-0033', present: 24, absent: 1, late: 0, excused: 0 }
  ];
  // School-wide daily attendance (last 10 school days)
  var attendanceDaily = [
    { date: '2026-10-29', rate: 94.1 }, { date: '2026-10-30', rate: 92.8 }, { date: '2026-11-02', rate: 93.6 }, { date: '2026-11-03', rate: 94.4 },
    { date: '2026-11-04', rate: 93.9 }, { date: '2026-11-05', rate: 92.2 }, { date: '2026-11-06', rate: 91.7 }, { date: '2026-11-09', rate: 93.1 },
    { date: '2026-11-10', rate: 94.0 }, { date: '2026-11-11', rate: 93.4 }
  ];

  // ---------- Approvals (unified inbox) ----------
  var approvals = [];
  var aprNo = 1051;
  admissions.filter(function (a) { return a.stage === 'Assessment'; }).forEach(function (a) {
    approvals.push({ id: 'APR-' + aprNo++, category: 'Admissions', title: 'Admission decision — ' + a.name, subtitle: classById[a.targetClass].name + ' · ' + a.entry, requesterId: 'EMP-0006', department: 'Admissions', submitted: shiftDate(a.submitted, 11), priority: a.programmeId === 'IBDP' ? 'High' : 'Medium', status: 'Pending', ref: { kind: 'admission', id: a.id } });
  });
  approvals.push({ id: 'APR-' + aprNo++, category: 'Departmental', title: 'Science lab consumables — Term 2 order', subtitle: 'Sciences department · GHS 18,400', requesterId: 'EMP-0031', department: 'Sciences', submitted: '2026-11-05', priority: 'Medium', status: 'Pending', amount: 18400, costCentre: 'CC-ACAD', details: 'Reagents, glassware and safety consumables for SHS, IGCSE and IB DP practical work in Term 2. Three supplier quotations attached; recommended supplier is the lowest compliant bid.', ref: { kind: 'request' } });
  approvals.push({ id: 'APR-' + aprNo++, category: 'Departmental', title: 'Replacement projector lamps (x6)', subtitle: 'ICT · GHS 7,200', requesterId: 'EMP-0018', department: 'ICT & Digital', submitted: '2026-11-08', priority: 'Low', status: 'Pending', amount: 7200, costCentre: 'CC-ICT', details: 'Six replacement lamps for classroom projectors (IB Centre and Block D). Linked to maintenance request MR-0416.', ref: { kind: 'request' } });
  approvals.push({ id: 'APR-' + aprNo++, category: 'Departmental', title: 'Inter-House Sports Festival budget', subtitle: 'Extra-Curricular & Sports · GHS 24,500', requesterId: 'EMP-0020', department: 'Extra-Curricular & Sports', submitted: '2026-11-03', priority: 'Medium', status: 'Pending', amount: 24500, costCentre: 'CC-ECA', details: 'Medals, equipment hire, first-aid cover, refreshments and PA system for the 28 November festival.', ref: { kind: 'request' } });
  leaves.filter(function (l) { return l.status === 'Pending'; }).forEach(function (l) {
    approvals.push({ id: 'APR-' + aprNo++, category: 'HR', title: l.type + ' — ' + employees.find(function (e) { return e.id === l.empId; }).shortName, subtitle: l.days + ' days · ' + l.from + ' to ' + l.to, requesterId: l.empId, department: 'Human Resources', submitted: l.submitted, priority: l.type === 'Compassionate leave' ? 'High' : 'Medium', status: 'Pending', ref: { kind: 'leave', id: l.id } });
  });
  approvals.push({ id: 'APR-' + aprNo++, category: 'HR', title: 'Fixed-term contract renewal — 2 support staff', subtitle: 'Kitchen & Catering · 12 months', requesterId: 'EMP-0005', department: 'Human Resources', submitted: '2026-11-02', priority: 'Medium', status: 'Pending', details: 'Renewal of fixed-term contracts for Assistant Cook (EMP-0026) and Storekeeper for a further 12 months on current terms. Performance reviews satisfactory.', ref: { kind: 'request' } });
  approvals.push({ id: 'APR-' + aprNo++, category: 'Operational', title: 'Emergency cold room compressor repair', subtitle: 'Facilities · GHS 11,800', requesterId: 'EMP-0007', department: 'Facilities & Maintenance', submitted: '2026-11-06', priority: 'High', status: 'Pending', amount: 11800, costCentre: 'CC-FAC', details: 'Contractor quotation for compressor overhaul. Linked to MR-0414 (cold room temperature alarm). Perishables currently held in backup freezers.', ref: { kind: 'maintenance', id: 'MR-0414' } });
  approvals.push({ id: 'APR-' + aprNo++, category: 'Operational', title: 'North perimeter fence repair', subtitle: 'Security · GHS 6,350', requesterId: 'EMP-0010', department: 'Security', submitted: '2026-11-10', priority: 'High', status: 'Pending', amount: 6350, costCentre: 'CC-SEC', details: 'Repair of fence section damaged by fallen branch (INC-0091). Temporary barrier in place.', ref: { kind: 'request' } });
  approvals.forEach(function (a) { a.history = [{ date: a.submitted, title: 'Submitted for approval', by: (employees.find(function (e) { return e.id === a.requesterId; }) || {}).shortName }]; });

  // ---------- Notifications ----------
  var notifications = [
    { id: 'N-201', title: 'Admission decisions awaiting you', text: '4 applicants have completed assessment and are ready for a decision.', time: '2026-11-11T08:05', read: false, link: '#/approvals', icon: 'user-plus', roles: ['head', 'admin'] },
    { id: 'N-202', title: 'Critical maintenance: Chemistry lab', text: 'Fume cupboard extractor fault (MR-0417). Practicals suspended.', time: '2026-11-11T07:40', read: false, link: '#/operations/facilities', icon: 'wrench', roles: ['head', 'admin'] },
    { id: 'N-203', title: '5 payment proofs awaiting verification', text: 'Parent-submitted references need Finance review.', time: '2026-11-10T16:12', read: false, link: '#/finance/verification', icon: 'receipt', roles: ['head', 'admin'] },
    { id: 'N-204', title: 'Kitchen low-stock alert', text: 'Maize flour, chicken, tomatoes and bread are below reorder level.', time: '2026-11-10T14:30', read: true, link: '#/operations/kitchen', icon: 'alert', roles: ['head', 'admin'] },
    { id: 'N-205', title: 'Finance & Audit Committee papers', text: '2 of 4 papers uploaded for 19 November.', time: '2026-11-09T11:20', read: true, link: '#/governance', icon: 'landmark', roles: ['head'] },
    { id: 'N-301', title: 'Attendance register pending', text: 'JHS 2A — Period 1 register has not been submitted.', time: '2026-11-11T08:35', read: false, link: '#/teacher/attendance', icon: 'check-square', roles: ['teacher'] },
    { id: 'N-302', title: 'Mid-term invigilation rota', text: 'You are invigilating 3 papers between 16–18 November.', time: '2026-11-10T12:00', read: false, link: '#/teacher', icon: 'calendar', roles: ['teacher'] },
    { id: 'N-303', title: '24 submissions to mark', text: 'Linear equations — problem set 4 (JHS 2A).', time: '2026-11-10T17:00', read: true, link: '#/teacher', icon: 'file-text', roles: ['teacher'] },
    { id: 'N-401', title: 'Term 1 balance — Yaw Adjei', text: 'An outstanding balance remains on invoice INV-27T1-0047.', time: '2026-11-10T09:00', read: false, link: '#/parent/fees', icon: 'receipt', roles: ['parent'] },
    { id: 'N-402', title: 'Mid-term timetable published', text: 'Examinations run 16–20 November.', time: '2026-11-10T08:30', read: false, link: '#/parent', icon: 'calendar', roles: ['parent'] },
    { id: 'N-403', title: 'Exeat request received', text: 'Weekend exeat for Yaw Adjei is awaiting boarding approval.', time: '2026-11-09T19:10', read: true, link: '#/parent', icon: 'home', roles: ['parent'] }
  ];

  // ---------- Activity log ----------
  var activity = [
    { id: 'A-1', time: '2026-11-11T08:42', actor: 'Hannah Forson', module: 'Security & Reception', text: 'Visitor checked in: Mr. Charles Mensah-Bonsu (admissions interview)', link: '#/operations/security' },
    { id: 'A-2', time: '2026-11-11T08:20', actor: 'Kwame Asante', module: 'Admissions', text: 'Interview scheduled for Abigail Owusu-Ansah (IGCSE Year 10)', link: '#/admissions' },
    { id: 'A-3', time: '2026-11-11T07:40', actor: 'Ebo Hagan', module: 'Facilities', text: 'MR-0417 escalated to Critical — Chemistry lab extractor', link: '#/operations/facilities' },
    { id: 'A-4', time: '2026-11-10T16:12', actor: 'Parent portal', module: 'Finance', text: 'Payment reference submitted for STU-0301 (GHS 1,500)', link: '#/finance/verification' },
    { id: 'A-5', time: '2026-11-10T15:05', actor: 'Selasi Dogbe', module: 'Finance', text: '14 payments synced from QuickBooks (simulated read-only)', link: '#/finance' },
    { id: 'A-6', time: '2026-11-10T11:30', actor: 'Isaac Lartey', module: 'HRMS', text: 'Compassionate leave request submitted for approval', link: '#/hr' },
    { id: 'A-7', time: '2026-11-10T09:15', actor: 'Kwaku Sarpong', module: 'Kitchen & Catering', text: 'Inventory count updated — 4 items below reorder level', link: '#/operations/kitchen' }
  ];

  // ---------- Remaining module datasets ----------
  var risks = [
    { id: 'RSK-01', risk: 'Fee receivables exceed 20% of term billing', category: 'Financial', likelihood: 'High', impact: 'High', ownerId: 'EMP-0004', status: 'Mitigating', review: '2026-11-19' },
    { id: 'RSK-02', risk: 'Science lab safety equipment ageing', category: 'Health & Safety', likelihood: 'Medium', impact: 'High', ownerId: 'EMP-0007', status: 'Mitigating', review: '2026-11-28' },
    { id: 'RSK-03', risk: 'Manual procurement approvals lack audit trail', category: 'Compliance', likelihood: 'Medium', impact: 'Medium', ownerId: 'EMP-0023', status: 'Open', review: '2026-11-19' },
    { id: 'RSK-04', risk: 'Key-person dependency in IB coordination', category: 'Operational', likelihood: 'Low', impact: 'High', ownerId: 'EMP-0005', status: 'Monitoring', review: '2026-12-03' },
    { id: 'RSK-05', risk: 'Student data held in disconnected spreadsheets', category: 'Data Protection', likelihood: 'High', impact: 'Medium', ownerId: 'EMP-0002', status: 'Mitigating', review: '2026-11-30' },
    { id: 'RSK-06', risk: 'Power supply interruptions affecting exams', category: 'Operational', likelihood: 'Medium', impact: 'Medium', ownerId: 'EMP-0007', status: 'Monitoring', review: '2026-12-15' }
  ];
  var audits = [
    { id: 'AUD-2026-03', area: 'Procurement & purchase approvals', findings: 4, high: 1, status: 'Management response due', due: '2026-11-19' },
    { id: 'AUD-2026-02', area: 'Kitchen stores & inventory', findings: 3, high: 0, status: 'Actions in progress', due: '2026-12-10' },
    { id: 'AUD-2026-01', area: 'Payroll & HR records', findings: 2, high: 0, status: 'Closed', due: '2026-07-30' }
  ];
  var compliance = [
    { id: 'CMP-01', item: 'GES / NaSIA licence renewal', authority: 'National Schools Inspectorate Authority', due: '2027-03-31', status: 'On track', ownerId: 'EMP-0002' },
    { id: 'CMP-02', item: 'IB programme evaluation self-study', authority: 'International Baccalaureate', due: '2027-06-30', status: 'In preparation', ownerId: 'EMP-0012' },
    { id: 'CMP-03', item: 'Cambridge centre annual compliance return', authority: 'Cambridge International', due: '2026-12-15', status: 'Due soon', ownerId: 'EMP-0013' },
    { id: 'CMP-04', item: 'Fire service safety certificate', authority: 'Ghana National Fire Service', due: '2026-11-30', status: 'Due soon', ownerId: 'EMP-0010' },
    { id: 'CMP-05', item: 'Food hygiene permit (kitchen)', authority: 'Food & Drugs Authority', due: '2027-02-28', status: 'On track', ownerId: 'EMP-0009' },
    { id: 'CMP-06', item: 'Data protection registration', authority: 'Data Protection Commission', due: '2026-12-31', status: 'Action required', ownerId: 'EMP-0002' },
    { id: 'CMP-07', item: 'SSNIT staff contributions — monthly', authority: 'SSNIT', due: '2026-11-14', status: 'On track', ownerId: 'EMP-0004' }
  ];
  var policies = [
    { id: 'POL-01', name: 'Safeguarding & Child Protection Policy', owner: 'EMP-0003', version: 'v3.1', reviewed: '2025-09-01', nextReview: '2026-11-30', status: 'Review due', acks: 71 },
    { id: 'POL-02', name: 'Fee Payment & Arrears Policy', owner: 'EMP-0004', version: 'v2.0', reviewed: '2026-09-10', nextReview: '2027-09-10', status: 'Current', acks: 64 },
    { id: 'POL-03', name: 'Staff Code of Conduct', owner: 'EMP-0005', version: 'v4.2', reviewed: '2026-08-20', nextReview: '2027-08-20', status: 'Current', acks: 79 },
    { id: 'POL-04', name: 'Boarding Rules & Exeat Procedure', owner: 'EMP-0008', version: 'v2.3', reviewed: '2026-08-25', nextReview: '2027-08-25', status: 'Current', acks: 58 },
    { id: 'POL-05', name: 'Assessment & Examinations Policy', owner: 'EMP-0003', version: 'v1.8', reviewed: '2026-06-12', nextReview: '2027-06-12', status: 'Current', acks: 66 },
    { id: 'POL-06', name: 'ICT Acceptable Use & Data Protection', owner: 'EMP-0002', version: 'v1.2', reviewed: '2024-10-01', nextReview: '2026-10-01', status: 'Overdue', acks: 44 },
    { id: 'POL-07', name: 'Health & Safety Policy', owner: 'EMP-0007', version: 'v2.1', reviewed: '2026-01-15', nextReview: '2027-01-15', status: 'Current', acks: 70 }
  ];
  var community = [
    { id: 'CP-01', name: 'Gomoa Manso Literacy Outreach', partner: 'Gomoa Manso D/A Basic School', type: 'Education', volunteers: 34, beneficiaries: 210, status: 'Active', hours: 186 },
    { id: 'CP-02', name: 'Coastal Clean-Up — Winneba Beach', partner: 'Effutu Municipal Assembly', type: 'Environment', volunteers: 52, beneficiaries: 0, status: 'Completed', hours: 208 },
    { id: 'CP-03', name: 'STEM Saturday for local JHS girls', partner: 'Agona Swedru JHS cluster', type: 'Education', volunteers: 18, beneficiaries: 64, status: 'Active', hours: 96 },
    { id: 'CP-04', name: 'Community health screening day', partner: 'Swedru Government Hospital', type: 'Health', volunteers: 22, beneficiaries: 340, status: 'Planned', hours: 0 },
    { id: 'CP-05', name: 'IB CAS: Tree planting initiative', partner: 'Forestry Commission (Central)', type: 'Environment', volunteers: 26, beneficiaries: 0, status: 'Active', hours: 120 }
  ];
  var alumni = [
    { id: 'ALU-0412', name: 'Kwabena Osei-Bonsu', cls: 2021, programme: 'IBDP', destination: 'University of Ghana — Medicine', location: 'Accra', engaged: 'Mentor' },
    { id: 'ALU-0398', name: 'Adwoa Frimpong', cls: 2020, programme: 'Cambridge', destination: 'KNUST — Computer Engineering', location: 'Kumasi', engaged: 'Career talk' },
    { id: 'ALU-0377', name: 'Yaa Asantewaa Mensah', cls: 2019, programme: 'IBDP', destination: 'University of Toronto — Economics', location: 'Toronto', engaged: 'Donor' },
    { id: 'ALU-0365', name: 'Ekow Arthur', cls: 2019, programme: 'GES SHS', destination: 'Ashesi University — Business Admin.', location: 'Berekuso', engaged: 'Mentor' },
    { id: 'ALU-0351', name: 'Selasi Agbeko', cls: 2018, programme: 'GES SHS', destination: 'UCC — Education', location: 'Cape Coast', engaged: '—' },
    { id: 'ALU-0340', name: 'Nii Lartey Ankrah', cls: 2018, programme: 'Cambridge', destination: 'University of Leeds — Law', location: 'London', engaged: 'Career talk' }
  ];
  var library = {
    titles: 8420, ebooks: 1260, onLoan: 312, overdue: 27, visitsThisWeek: 486,
    loans: [
      { id: 'LN-9921', title: 'Things Fall Apart — Chinua Achebe', studentId: 'STU-0012', due: '2026-11-14', status: 'On loan', renewals: 0 },
      { id: 'LN-9918', title: 'Cambridge IGCSE Physics (3rd ed.)', studentId: 'STU-0047', due: '2026-11-08', status: 'Overdue', renewals: 1 },
      { id: 'LN-9910', title: 'Oxford IB Biology Course Companion', studentId: null, due: '2026-11-18', status: 'On loan', renewals: 0 },
      { id: 'LN-9902', title: 'Ghana: A Concise History', studentId: null, due: '2026-11-05', status: 'Overdue', renewals: 2 },
      { id: 'LN-9897', title: 'Core Mathematics for SHS — Book 2', studentId: null, due: '2026-11-20', status: 'On loan', renewals: 0 },
      { id: 'LN-9890', title: 'Half of a Yellow Sun — C. N. Adichie', studentId: null, due: '2026-11-12', status: 'On loan', renewals: 1 }
    ]
  };
  library.loans.forEach(function (l, i) { if (!l.studentId) l.studentId = students[(i * 37 + 5) % students.length].id; });

  var roles = [
    { id: 'head', name: 'Head of School / Management', users: 3, scope: 'Institution-wide (all modules, approvals, governance)' },
    { id: 'admin', name: 'School Administrator', users: 6, scope: 'Students, admissions, operations, finance (view), HR' },
    { id: 'finance', name: 'Finance Officer', users: 3, scope: 'Fees, payment verification, budgets (QuickBooks read-only)' },
    { id: 'teacher', name: 'Teacher', users: 44, scope: 'Own classes, attendance, assignments, results entry' },
    { id: 'nurse', name: 'Infirmary Staff', users: 2, scope: 'Confidential health records (restricted)' },
    { id: 'parent', name: 'Parent / Guardian', users: 361, scope: 'Linked children only: academics, fees, communication' },
    { id: 'board', name: 'Board Member', users: 9, scope: 'Governance papers, strategic KPIs (read-only)' }
  ];
  var permissionMatrix = {
    modules: ['Student records', 'Admissions', 'Attendance', 'Exam results', 'Finance & fees', 'Payroll', 'Medical records', 'Governance papers'],
    grants: {
      head: ['full', 'approve', 'view', 'view', 'view', 'view', 'none', 'full'],
      admin: ['full', 'full', 'view', 'view', 'view', 'none', 'none', 'view'],
      finance: ['view', 'none', 'none', 'none', 'full', 'full', 'none', 'none'],
      teacher: ['own', 'none', 'own', 'own', 'none', 'none', 'none', 'none'],
      nurse: ['view', 'none', 'none', 'none', 'none', 'none', 'full', 'none'],
      parent: ['own', 'none', 'own', 'own', 'own', 'none', 'none', 'none'],
      board: ['none', 'none', 'none', 'none', 'view', 'none', 'none', 'view']
    }
  };
  var accessLog = [
    { time: '2026-11-11T08:31', user: 'Kwame Asante', action: 'Signed in', ip: '10.0.4.21', result: 'Success' },
    { time: '2026-11-11T08:02', user: 'Efua Boateng', action: 'Signed in', ip: '10.0.6.14', result: 'Success' },
    { time: '2026-11-11T07:58', user: 'unknown@mics.edu.gh', action: 'Sign-in attempt', ip: '41.66.x.x', result: 'Blocked (MFA)' },
    { time: '2026-11-10T17:44', user: 'Selasi Dogbe', action: 'Role permission viewed: Finance Officer', ip: '10.0.4.33', result: 'Success' }
  ];

  return {
    meta: { today: TODAY, academicYear: ACADEMIC_YEAR, term: TERM, termDays: TERM_DAYS_ELAPSED, termStart: '2026-09-07', termEnd: '2026-12-11', ytdPhase: YTD_PHASE, version: 2 },
    programmes: programmes, subjectsByProgramme: subjectsByProgramme, classes: classes, allocations: allocations,
    students: students, parents: parents, employees: employees,
    invoices: invoices, payments: payments, termFee: termFee, boardingFee: boardingFee, budgets: budgets,
    admissions: admissions, approvals: approvals, leaves: leaves, maintenance: maintenance,
    boardingHouses: boardingHouses, exeats: exeats, menu: menu, inventory: inventory, kitchenWeekly: kitchenWeekly,
    visitors: visitors, incidents: incidents, infirmary: infirmary,
    meetings: meetings, resolutions: resolutions, actions: actions, strategicPlan: strategicPlan, kpis: kpis,
    events: events, announcements: announcements, appointments: appointments,
    assignments: assignments, exams: exams, examSlots: examSlots, periods: periods, teacherTimetable: teacherTimetable,
    registers: registers, attendanceDaily: attendanceDaily, clubs: clubs,
    notifications: notifications, activity: activity,
    risks: risks, audits: audits, compliance: compliance, policies: policies, community: community, alumni: alumni,
    library: library, roles: roles, permissionMatrix: permissionMatrix, accessLog: accessLog
  };
})();
