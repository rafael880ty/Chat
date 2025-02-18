const io = require('socket.io')({
  cors: {
    origin: "*"
  }
});

const server = io.listen(3000);

console.log('Server listening on port 3000');

let users = {};
let conversations = {};

io.on('connection', socket => {
  let username;

  socket.on('username', (name) => {
    username = name;
    socket.username = username;
    users[socket.id] = username;
    conversations[username] = conversations[username] || {};

    // Join a room named after the username
    socket.join(username);

    // Envia a lista de usuários atualizada para todos os clientes
    io.emit('users', Object.values(users));
    socket.emit('conversations', conversations[username]);
  });


  socket.on('disconnect', () => {
    delete users[socket.id];
    io.emit('users', Object.values(users));
  });

  socket.on('private message', (message) => {
    // Ensure conversations exist for both users
    conversations[message.from] = conversations[message.from] || {};
    conversations[message.to] = conversations[message.to] || {};

    // Store the message in the sender's and receiver's conversation
    conversations[message.from][message.to] = conversations[message.from][message.to] || [];
    conversations[message.from][message.to].push(message);
    conversations[message.to][message.from] = conversations[message.to][message.from] || [];
    conversations[message.to][message.from].push(message);

    // Send the message only to the recipient
    io.to(message.to).emit('message', message);
    // Also send it back to the sender so they see it in their window
    io.to(message.from).emit('message', message);

    // Update conversations for both users
    io.to(message.from).emit('conversations', conversations[message.from]);
    io.to(message.to).emit('conversations', conversations[message.to]);

    console.log(`Mensagem privada de ${message.from} para ${message.to}: ${message.text}`);
  });

  socket.on('add user', (data) => {
    const { from, to } = data;

    // Check if the user to add exists
    if (!Object.values(users).includes(to)) {
      socket.emit('user added', { success: false, to: to, message: `Usuário ${to} não encontrado.` });
      return;
    }
  
    conversations[from] = conversations[from] || {};
    conversations[to] = conversations[to] || {};

    conversations[from][to] = conversations[from][to] || [];
    conversations[to][from] = conversations[to][from] || [];

    io.to(from).emit('user added', { success: true, to: to });
    io.to(from).emit('conversations', conversations[from]);
  });

  socket.on('request conversations', (user) => {
    socket.emit('conversations', conversations[user]);
  });


  socket.on('connect_error', (err) => {
    console.log(`connect_error due to ${err.message}`);
  });
});