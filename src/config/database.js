const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);


const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connect = async () => {
    try {
        await mongoose.connect(
           
             "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.8.2",
            {
                serverSelectionTimeoutMS: 5000
            }
        );
        console.log("database connected successfully ✅");

    } catch (err) {
        console.error("database cannot be connected ❌ " + err.message);
    }
};

connect();

module.exports = connect;