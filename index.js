const express = require("express");
const cors = require("cors");
const { mongoose } = require("mongoose");
const User = require("./models/user");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser')

const salt = bcrypt.genSaltSync(10);
const secret = "clna;sdkfmadlkfwmera";

app.use(cors({credentials:true, origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(
  "mongodb+srv://justplainrodney:YURZPRiMet5Dj22@cluster0.0yjtior.mongodb.net/?retryWrites=true&w=majority"
);

app.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, passwordConfirmation } =
    req.body;
  try {
    const userDoc = await User.create({
      firstName,
      lastName,
      email,
      password: bcrypt.hashSync(password, salt),
      passwordConfirmation: bcrypt.hashSync(passwordConfirmation, salt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(400).json(e);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    jwt.sign({ email, id:userDoc._id }, secret, {}, (err, token) => {
      if (err) {throw err};
      res.cookie('token', token).json({
        id: userDoc._id,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        email: userDoc.email,
      });
    });
  } else {
    res.status(400).json("Wrong credentials");
  }
});

app.get('/profile', (req, res) => {
  const {token} = req.cookies;
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      throw err
    }
    res.json(info)
  })

})

app.post('/logout', (req, res) => {
  res.cookie('token', '').json('ok')
})

app.listen(4000);
