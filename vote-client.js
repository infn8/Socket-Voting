  var host;
  host = "localhost:3000";
  if(window.location.hostname == "infn8-sockets.nodejitsu.com"){
    host = "http://infn8-sockets.nodejitsu.com/";
  }
  var socket = io(host);
  var maxRotate = 107;
$(document).ready(function() {
  
  // host = "http://localhost";
  $('form').submit(function(){
    socket.emit('chat message', $('#m').val());
    $('#m').val('');
    return false;
  });
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });
  $('.plus-button').click(function(){
    socket.emit('vote', { qty: 1 });
  });
  $('.minus-button').click(function(){
    socket.emit('vote', { qty: -1 });
  });
  $('.pulse-button').click(function(){
    socket.emit('pulse-check', { clearAll: true });
  });
  socket.on('score-update', function(score){
    $('.score').text("Plus Votes: " + score.plusCount + " Minus Votes: " + score.minusCount + " Average Score: " + score.score);
    // let's Move the needle
    newDegrees = maxRotate * score.score;
    $('#needle').css('transform', 'rotate('+newDegrees+'deg)');
  });
  socket.on('admin-login', function(result){
    if(result.admin){
      window.isAdmin = true;
    }
  });

});
