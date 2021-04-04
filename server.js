const express = require('express');
const server = express();
const PORT = process.env.PORT || 5000;
server.listen(PORT,()=>{
  console.log (`listening on PORT ${PORT}`);
});
require('dotenv').config();
const cors = require('cors');
server.use (cors());


server.get ('/',(req,res)=>{
  res.send('server is alive !');
});

