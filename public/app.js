// Minimal Mock Test Portal (public copy)
// Ensure you set firebaseConfig in app.js for real use; this is a static copy.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js'
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js'
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, query, orderBy, limit } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// UI refs
const authSection = document.getElementById('auth-section')
const homeSection = document.getElementById('home-section')
const testSection = document.getElementById('test-section')
const resultSection = document.getElementById('result-section')
const adminSection = document.getElementById('admin-section')
const leaderboardSection = document.getElementById('leaderboard-section')
const userInfo = document.getElementById('user-info')

function show(...els){
  const panels = [authSection, homeSection, testSection, resultSection, adminSection, leaderboardSection]
  panels.forEach(p=>p.classList.add('hidden'))
  els.forEach(e=>e.classList.remove('hidden'))
}

// Theme handling (basic)
const themeBtn = document.getElementById('btn-theme')
function setTheme(mode){
  if(mode==='dark') document.documentElement.classList.add('dark-theme')
  else document.documentElement.classList.remove('dark-theme')
  localStorage.setItem('theme', mode)
  if(themeBtn) themeBtn.textContent = mode==='dark' ? '☀️' : '🌙'
}
const savedTheme = localStorage.getItem('theme') || 'light'
setTheme(savedTheme)
if(themeBtn) themeBtn.onclick = ()=> setTheme(document.documentElement.classList.contains('dark-theme') ? 'light' : 'dark')

// Auth handlers (same as source)
document.getElementById('btn-signup').onclick = async ()=>{
  const displayName = document.getElementById('displayName').value || ''
  const email = document.getElementById('email').value
  const pass = document.getElementById('password').value
  if(!email||!pass) return alert('enter creds')
  const cred = await createUserWithEmailAndPassword(auth, email, pass)
  if(displayName) await updateProfile(cred.user, { displayName })
  await setDoc(doc(db,'users',cred.user.uid),{email,role:'student',displayName})
}
document.getElementById('btn-signin').onclick = async ()=>{
  const email = document.getElementById('email').value
  const pass = document.getElementById('password').value
  if(!email||!pass) return alert('enter creds')
  await signInWithEmailAndPassword(auth, email, pass)
}

document.getElementById('btn-start').onclick = ()=>startTest()
document.getElementById('btn-leaderboard').onclick = ()=>loadLeaderboard()
document.getElementById('btn-admin').onclick = ()=>showAdmin()
document.getElementById('btn-back').onclick = ()=>show(homeSection)
document.getElementById('btn-back-home').onclick = ()=>show(homeSection)

// Edit profile (display name)
const editProfileBtn = document.getElementById('btn-edit-profile')
if(editProfileBtn){
  editProfileBtn.onclick = async ()=>{
    if(!currentUser) return alert('sign in first')
    const newName = prompt('Enter display name', currentUser.displayName || '')
    if(!newName) return
    await updateProfile(currentUser, { displayName: newName })
    await setDoc(doc(db,'users',currentUser.uid),{email:currentUser.email,displayName:newName,role:'student'},{merge:true})
    userInfo.innerHTML = `${newName} | student | <button id="signout">Sign out</button>`
    document.getElementById('signout').onclick = ()=>signOut(auth)
  }
}

let currentUser = null
onAuthStateChanged(auth, async user=>{
  currentUser = user
  if(user){
    const qsnap = await getDocs(collection(db,'users'))
    const udoc = qsnap.docs.find(d=>d.id===user.uid)
    const role = udoc ? udoc.data().role : 'student'
    const displayName = user.displayName || (udoc && udoc.data().displayName) || user.email
    userInfo.innerHTML = `${displayName} | ${role} | <button id="signout">Sign out</button>`
    document.getElementById('signout').onclick = ()=>signOut(auth)
    show(homeSection)
  } else {
    userInfo.innerText = ''
    show(authSection)
  }
})

// Questions & Test flow (same functions)
let questions = []
let answers = {}
let currentIndex = 0
let timerInterval = null
let timeLeft = 60*10 // default 10 minutes

async function loadQuestions(){
  const qsnap = await getDocs(collection(db,'questions'))
  questions = qsnap.docs.map(d=>({id:d.id,...d.data()}))
}

function renderQuestion(){
  const qa = questions[currentIndex]
  const area = document.getElementById('question-area')
  area.innerHTML = ''
  if(!qa) return area.innerText = 'No question'
  const q = document.createElement('div')
  q.className='question'
  q.innerHTML = `<h3>${currentIndex+1}. ${qa.text}</h3>`
  const opts = document.createElement('div')
  qa.options.forEach(opt=>{
    const id = 'opt-'+Math.random().toString(36).slice(2)
    const label = document.createElement('label')
    label.innerHTML = `<input type="radio" name="opt" value="${opt}" ${answers[qa.id]===opt?'checked':''}/> ${opt}`
    opts.appendChild(label)
    opts.appendChild(document.createElement('br'))
  })
  q.appendChild(opts)
  area.appendChild(q)
}

document.getElementById('btn-next').onclick = ()=>{
  saveAnswer()
  if(currentIndex<questions.length-1) currentIndex++
  renderQuestion()
}
document.getElementById('btn-prev').onclick = ()=>{
  saveAnswer()
  if(currentIndex>0) currentIndex--
  renderQuestion()
}

function saveAnswer(){
  const sel = document.querySelector('input[name="opt"]:checked')
  if(!questions[currentIndex]) return
  answers[questions[currentIndex].id] = sel?sel.value:null
}

document.getElementById('btn-submit').onclick = ()=>{
  saveAnswer()
  submitTest()
}

function startTimer(){
  clearInterval(timerInterval)
  timerInterval = setInterval(()=>{
    timeLeft--
    const mm = String(Math.floor(timeLeft/60)).padStart(2,'0')
    const ss = String(timeLeft%60).padStart(2,'0')
    document.getElementById('time-left').innerText = `${mm}:${ss}`
    if(timeLeft<=0){
      clearInterval(timerInterval)
      submitTest()
    }
  },1000)
}

async function startTest(){
  await loadQuestions()
  answers = {}
  currentIndex = 0
  timeLeft = Math.max(60, questions.length*60)
  renderQuestion()
  show(testSection)
  startTimer()
}

async function submitTest(){
  clearInterval(timerInterval)
  let correct = 0
  const details = []
  questions.forEach(q=>{
    const given = answers[q.id] || null
    const ok = given && given===q.answer
    if(ok) correct++
    details.push({question:q.text, given, correct: q.answer})
  })
  const score = Math.round((correct/questions.length)*100 || 0)
  if(currentUser) await addDoc(collection(db,'scores'),{uid:currentUser.uid,email:currentUser.email,score,ts:Date.now()})
  document.getElementById('score-area').innerText = `Score: ${score}% (${correct}/${questions.length})`
  const aarea = document.getElementById('answers-area')
  aarea.innerHTML = ''
  details.forEach(d=>{
    const p = document.createElement('div')
    p.innerHTML = `<b>${d.question}</b><br/>Your answer: ${d.given} | Correct: ${d.correct}`
    aarea.appendChild(p)
  })
  show(resultSection)
}

// Admin CRUD
document.getElementById('btn-add-q').onclick = async ()=>{
  const text = document.getElementById('q-text').value
  const options = document.getElementById('q-options').value.split(',').map(s=>s.trim()).filter(Boolean)
  const answer = document.getElementById('q-answer').value.trim()
  if(!text||options.length<2||!answer) return alert('fill fields')
  await addDoc(collection(db,'questions'),{text,options,answer})
  document.getElementById('q-text').value=''
  document.getElementById('q-options').value=''
  document.getElementById('q-answer').value=''
}

async function showAdmin(){
  if(!currentUser) return alert('sign in')
  const udoc = await (await getDocs(collection(db,'users'))).docs.find(d=>d.id===currentUser.uid)
  if(!udoc || udoc.data().role!=='admin') return alert('admin only')
  const qcoll = collection(db,'questions')
  onSnapshot(qcoll, snap=>{
    const ul = document.getElementById('questions-list')
    ul.innerHTML = ''
    snap.docs.forEach(docu=>{
      const li = document.createElement('li')
      li.innerHTML = `<div><b>${docu.data().text}</b> — <button data-id="${docu.id}" class="del">Delete</button> <button data-id="${docu.id}" class="edit">Edit</button></div>`
      ul.appendChild(li)
    })
    ul.querySelectorAll('.del').forEach(b=>b.onclick=async e=>{await deleteDoc(doc(db,'questions',e.target.dataset.id))})
    ul.querySelectorAll('.edit').forEach(b=>b.onclick=async e=>{
      const id = e.target.dataset.id
      const d = snap.docs.find(x=>x.id===id)
      const text = prompt('Question text',d.data().text)
      const options = prompt('Options (comma-separated)',d.data().options.join(','))
      const answer = prompt('Correct answer',d.data().answer)
      if(text && options && answer) await updateDoc(doc(db,'questions',id),{text,options:options.split(',').map(s=>s.trim()),answer})
    })
  })
  show(adminSection)
}

// Leaderboard
async function loadLeaderboard(){
  const q = query(collection(db,'scores'), orderBy('score','desc'))
  const snaps = await getDocs(q)
  const ol = document.getElementById('leaderboard-list')
  ol.innerHTML = ''
  snaps.docs.slice(0,20).forEach(s=>{
    const li = document.createElement('li')
    li.innerText = `${s.data().email} — ${s.data().score}%`
    ol.appendChild(li)
  })
  show(leaderboardSection)
}

// initial
show(authSection)
