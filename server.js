const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;
var app = express();

mongo.listen(process.env.PORT || 3000);

// connect to mongo

mongo.connect('mongodb://127.0.0.1/chat',{ useNewUrlParser: true },function(err, db){
    if(err){
        throw err;
    }
    console.log('Mongodb connected...');
    var database = db.db('chat');
    // Connect to Socket.io
    client.on('connection', function(socket){

        var chat = database.collection('messages'); // collection message 

        // Create function to send status
        sendStatus = function(s){
            socket.emit('status', s);
        }

        // Get chats from mongo cllection

        chat.find().limit(100).sort({_id: 1}).toArray(function(err, res){ 
            if(err){
                throw err;
            }

            // emit the messages
            socket.emit('output', res);
        });

        // handle input events
        socket.on('input', function(data){
            var name = data.name;
            var message = data.message;

            // Check for name and message
            if(name == '' || message == ''){
                // send err status
                sendStatus('Please enter name and message');
            }else{
                // insert message to database
                chat.insert({name: name, message: message}, function(){
                    client.emit('output', [data]);

                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }
        });
        // Handle clear
        socket.on('clear', function(data){
            // remove all chats from collection
            chat.remove({}, function(){
                socket.emit('cleared');
            });
        });
    });
});