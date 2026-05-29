let token = localStorage.getItem('token');
let username = localStorage.getItem('username');
let currentRoom = 'عام';
let socket = io();
let localStream;
let peerConnections = {};
let isMuted = false;

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// التنقل بين الشاشات
function showRegister(){
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('register-screen').classList.add('active');
}
function showLogin(){
  document.getElementById('register-screen').classList.remove('active');
  document.getElementById('login-screen').classList.add('active');
}

// التسجيل
async function register(){
  const res = await fetch('/api/register',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      username:reguser.value,
      password:regpass.value
    })
  });
  const data = await res.json();
  alert(data.msg || data.err);
  if(data.ok) showLogin();
}

// تسجيل الدخول
async function login(){
  const res = await fetch('/api/login',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      username:loginuser.value,
      password:loginpass.value
    })
  });
  const data = await res.json();
  if(data.err) return alert(data.err);

  token = data.token;
  username = data.username;
  localStorage.setItem('token',token);
  localStorage.setItem('username',username);

  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('chat-screen').classList.add('active');

  initChat();
}function initChat(){
  socket.emit('join-room',{token,roomName:currentRoom});

  socket.on('old-messages',msgs=>{
    msgs.forEach(addMessage);
  });

  socket.on('new-message',addMessage);

  socket.on('system',msg=>{
    addMessage({user:'النظام',text:msg,color:'#ffff00'});
  });

  socket.on('users-list',users=>{
    updateUsersList(users);
  });

  socket.on('voice-offer',handleVoiceOffer);
  socket.on('voice-answer',handleVoiceAnswer);
  socket.on('ice-candidate',handleICECandidate);
}

function addMessage(msg){
  const div=document.createElement('div');
  div.className='msg';
  div.innerHTML=`<span class="user" style="color:${msg.color}">[${msg.rank}] ${msg.user}:</span> ${msg.text}`;
  messages.appendChild(div);
  messages.scrollTop=messages.scrollHeight;
}

function sendMessage(){
  const text=msginput.value.trim();
  if(!text)return;
  socket.emit('send-message',{text});
  msginput.value='';
}

function updateUsersList(users){
  userslist.innerHTML='';
  users.forEach(u=>{
    userslist.innerHTML+=`<div class="user-item">
      <span style="color:${u.color}">${u.username}</span>
      <span class="rank-badge" style="background:${u.color}">${u.rank}</span>
    </div>`;
  });
}// تشغيل/إيقاف المايك
async function toggleMic(){
  if(!localStream){
    try{
      localStream=await navigator.mediaDevices.getUserMedia({audio:true,video:false});
      document.getElementById('mic-btn').className='voice-btn mic-on';
      startVoiceChat();
    }catch(e){
      alert('لم يتم السماح بالميكروفون');
    }
  }else{
    localStream.getTracks().forEach(track=>track.stop());
    localStream=null;
    document.getElementById('mic-btn').className='voice-btn mic-off';
  }
}

function startVoiceChat(){
  socket.emit('join-voice',{room:currentRoom});
}

socket.on('user-joined-voice',async userId=>{
  const pc=createPeerConnection(userId);
  const offer=await pc.createOffer();
  await pc.setLocalDescription(offer);
  socket.emit('voice-offer',{to:userId,offer});
});

function createPeerConnection(userId){
  const pc=new RTCPeerConnection(config);
  peerConnections[userId]=pc;

  localStream.getTracks().forEach(track=>pc.addTrack(track,localStream));

  pc.onicecandidate=e=>{
    if(e.candidate){
      socket.emit('ice-candidate',{to:userId,candidate:e.candidate});
    }
  };

  pc.ontrack=e=>{
    const audio=document.createElement('audio');
    audio.srcObject=e.streams[0];
    audio.autoplay=true;
    document.body.appendChild(audio);
  };

  return pc;
}async function handleVoiceOffer({from,offer}){
  const pc=createPeerConnection(from);
  await pc.setRemoteDescription(offer);
  const answer=await pc.createAnswer();
  await pc.setLocalDescription(answer);
  socket.emit('voice-answer',{to:from,answer});
}

async function handleVoiceAnswer({from,answer}){
  const pc=peerConnections[from];
  if(pc)await pc.setRemoteDescription(answer);
}

async function handleICECandidate({from,candidate}){
  const pc=peerConnections[from];
  if(pc)await pc.addIceCandidate(candidate);
}

function leaveVoice(){
  Object.values(peerConnections).forEach(pc=>pc.close());
  peerConnections={};
  if(localStream){
    localStream.getTracks().forEach(track=>track.stop());
    localStream=null;
  }
}