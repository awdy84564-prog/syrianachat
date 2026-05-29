const socket = io();
let token = localStorage.getItem('token');
let currentRoom = 'عام';
let micOn = true;

if (token) showChat();

function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  fetch('/api/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  }).then(r => r.json()).then(d => {
    if(d.token){ token = d.token; localStorage.setItem('token', token); showChat(); }
    else alert(d.error);
  });
}

function register() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  fetch('/api/register', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  }).then(r => r.json()).then(d => alert(d.message || d.error));
}

function showChat() {
  document.getElementById('login-screen').classList.remove('active');
  document.getElementById('chat-screen').classList.add('active');
  socket.emit('join', {token, room: currentRoom});
}

function sendMessage() {
  const msg = document.getElementById('msg-input').value;
  if(!msg) return;
  socket.emit('message', {token, room: currentRoom, message: msg});
  document.getElementById('msg-input').value = '';
}

socket.on('message', data => {
  const div = document.createElement('div');
  div.innerHTML = `<b>${data.username}:</b> ${data.message}`;
  div.style.marginBottom = '8px';
  document.getElementById('messages').appendChild(div);
  document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
});

socket.on('users', users => {
  document.getElementById('users-list').innerHTML = users.map(u => `<div style="padding:5px 10px">${u}</div>`).join('');
});

document.getElementById('mic-btn').onclick = () => {
  micOn = !micOn;
  document.getElementById('mic-btn').classList.toggle('mic-off');
  socket.emit('mic-toggle', {token, on: micOn});
};

function leaveVoice() {
  socket.emit('leave-voice', {token});
                                           }
