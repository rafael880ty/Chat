const usernameSetup = document.getElementById('username-setup');
const chatContainer = document.getElementById('chat-container');
const usernameInput = document.getElementById('username-input');
const usernameButton = document.getElementById('username-button');
const usersList = document.getElementById('users');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const addUserInput = document.getElementById('add-user-input');
const addUserButton = document.getElementById('add-user-button');
const conversationsList = document.getElementById('conversations');
const userInfoDiv = document.getElementById('user-info');

let username;
let socket;
let selectedUser;
let conversations = {}; // Store conversations

usernameButton.addEventListener('click', () => {
  username = usernameInput.value.trim();
  if (username) {
    initializeChat(username);
    usernameSetup.classList.add('hidden');
    chatContainer.classList.remove('hidden');
    displayUserInfo(username); // Display username after login
  } else {
    alert('Por favor, insira um nome de usuário.');
  }
});

function initializeChat(username) {
  socket = io('http://localhost:3000', {
    query: { username: username }
  });

  socket.on('connect', () => {
    socket.emit('username', username);
  });

  socket.on('users', (users) => {
    displayUsers(users);
  });

  socket.on('message', (message) => {
    displayMessage(message);
  });

  socket.on('private message', (message) => {
    displayMessage(message);
    saveMessage(message.from === username ? message.to : message.from, message);
  });

  socket.on('conversations', (data) => {
    conversations = data;
    displayConversations();
  });

  socket.on('user added', (data) => {
    if (data.success) {
      alert(`Usuário ${data.to} adicionado com sucesso!`);
      // Optionally, refresh the conversations list
      socket.emit('request conversations', username);
    } else {
      alert(data.message || `Não foi possível adicionar o usuário ${data.to}.`);
    }
  });
}

function displayUsers(users) {
  usersList.innerHTML = '';
  users.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    li.addEventListener('click', () => {
      selectedUser = user;
      console.log(`Conversando com: ${selectedUser}`);
    });
    usersList.appendChild(li);
  });
}

sendButton.addEventListener('click', () => {
  const messageText = messageInput.value.trim();
  if (messageText && selectedUser) {
    const message = {
      to: selectedUser,
      from: username,
      text: messageText
    };
    socket.emit('private message', message);
    displayMessage(message, true);
    saveMessage(selectedUser, message);
    messageInput.value = '';
  } else if (!selectedUser) {
    alert('Selecione um usuário para enviar a mensagem.');
  } else {
    alert('Por favor, digite uma mensagem.');
  }
});

function displayMessage(message, isMe = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message');
  messageDiv.classList.add(isMe ? 'me' : 'other');
  messageDiv.textContent = `${message.from}: ${message.text}`;
  messagesDiv.appendChild(messageDiv);

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function saveMessage(user, message) {
  if (!conversations[user]) {
    conversations[user] = [];
  }
  conversations[user].push(message);
  displayConversations();
  displayMessagesFromConversation(user); // Display messages immediately
}

function displayConversations() {
  conversationsList.innerHTML = '';
  for (const user in conversations) {
    const li = document.createElement('li');
    li.textContent = user;
    li.addEventListener('click', () => {
      selectedUser = user;
      displayMessagesFromConversation(user);
    });
    conversationsList.appendChild(li);
  }
}

function displayMessagesFromConversation(user) {
  messagesDiv.innerHTML = '';
  if (conversations[user]) {
    conversations[user].forEach(message => {
      const isMe = message.from === username;
      displayMessage(message, isMe);
    });
  }
  selectedUser = user;
}

addUserButton.addEventListener('click', () => {
  const userToAdd = addUserInput.value.trim();
  if (userToAdd && userToAdd !== username) {
    socket.emit('add user', { from: username, to: userToAdd });
    addUserInput.value = '';
  } else if (userToAdd === username) {
    alert('Você não pode adicionar você mesmo.');
  } else {
    alert('Por favor, insira um nome de usuário válido.');
  }
});

function displayUserInfo(username) {
  userInfoDiv.innerHTML = `<h3>Seu Usuário</h3><p>${username}</p>`;
}