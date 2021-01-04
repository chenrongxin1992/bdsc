// 配置
var config = {  
  user: 'sa',  
  password: 'keylands29',  
  server: '172.21.235.11',   
  database: 'csseHere2015',  
  port:1433,  
  options: {  
    encrypt: true // windows on
  },  
  pool: {  
    min: 0,  
    max: 10,  
    idleTimeoutMillis: 3000  
  }  
}; 

module.exports = config;