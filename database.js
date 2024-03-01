const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcrypt');

mongoose.connect(process.env.MONGODB_CONNECT_URI)
    .then(() => console.log('Connected to MongoDB Atlas!'))
    .catch(err => console.error('Connection error:', err));

const { Schema, ObjectId } = mongoose;

// User schema
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    is_admin: { type: Boolean, default: false }
});

userSchema.pre('save', async function (next) {
   try {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
   }
   catch (error) {    next(error);
   }
});
userSchema.methods.comparePassword = async function(candidatePassword) {    try {
    return await bcrypt.compare(candidatePassword, this.password);    } catch (error) {
    throw new Error(error);    }
};

const logsSchema = new Schema({    user: { type: ObjectId, ref: 'User' },
    request_type: String,    request_data: String,
    status_code: String,    timestamp: { type: Date, default: Date.now },
    response_data: String});
// User IP schema
const userIpSchema = new Schema({    ip: String,
    user: { type: ObjectId, ref: 'User' }});

// Superhero schema
const superheroSchema = new mongoose.Schema({
    name: String,
    description: String,
    images: [String],
    timestamps: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        deleted_at: { type: Date }
    }
});

// Models
const UserModel = mongoose.model('User', userSchema);
const LogsModel = mongoose.model('Logs', logsSchema);
const UserIpModel = mongoose.model('UserIp', userIpSchema);
const SuperheroModel = mongoose.model('Superheroe', superheroSchema); // Add Superhero model

module.exports = {
    UserModel,
    LogsModel,
    UserIpModel,
    SuperheroModel // Export Superhero model
};


