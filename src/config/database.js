const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

const connect = async () => {
    try {
        // 🔴 FIX: pehle yahan seedha "127.0.0.1" (local MongoDB) hardcoded tha —
        // isliye Render pe deploy hone ke baad bhi wo apne local MongoDB se hi
        // connect karne ki koshish kar raha tha, jo cloud se access hi nahi hota.
        // Ab process.env.MONGO_URI use kar rahe hain — Render pe Atlas wali URI
        // milegi, local dev me agar .env me MONGO_URI na ho to purani local wali
        // fallback ki tarah use ho jayegi.
        const MONGO_URI =
            process.env.MONGO_URI ||
            "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.8.2";

        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log("database connected successfully ✅");

    } catch (err) {
        console.error("database cannot be connected ❌ " + err.message);
    }
};

connect();

module.exports = connect;