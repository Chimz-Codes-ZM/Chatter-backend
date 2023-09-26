const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const User = require("./models/user");
const Post = require("./models/post");
const bcrypt = require("bcryptjs");
const app = express();
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser')
const multer  = require('multer')
const uploadMiddleware = multer({ dest: 'uploads/' })
const fs = require('fs');
const path = require("path");

const salt = bcrypt.genSaltSync(10);
const secret = "clna;sdkfmadlkfwmera";

// app.use(cors({credentials:true, origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(process.env.MONGODB_CONNECT_URL);

app.get("/", (req, res) => {
  res.send("Hello World");
});

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

app.use('/uploads', express.static('uploads'));
app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  const {originalname,path} = req.file;
  const parts = originalname.split('.')
  const ext = parts[parts.length - 1]
  const newPath = path+'.'+ext
  fs.renameSync(path, newPath) 

  const {token} = req.cookies;

  jwt.verify(token, secret, {}, async(err, info) => {
    if (err) {
      throw err
    }

    const {title, summary, content} = req.body;
    const postDoc = await Post.create({
     title,
       summary,
       content,
       cover:newPath,
       author:info.id,
    });
    res.json(postDoc)

   
  })
})


app.get("/posts", async (req, res) => {
  res.json(await Post.find()
  .populate('author', ['username'])
  .sort({createdAt: -1})
  .limit(20)
  );
});

app.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
 const postDoc = await Post.findById(id).populate('author', ['username']);
 if (postDoc) {
  postDoc.views++;
  await postDoc.save();
  res.json(postDoc);
 } else {
  res.status(404).json({ error: 'Post not found' });
 }

})

app.put('/post/:id', async (req, res) => {
  const postId = req.params.id;
  const { title, summary, content } = req.body;
  const { token } = req.cookies;

  try {
    jwt.verify(token, secret, {}, async (err, info) => {
      if (err) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      if (post.author.toString() !== info.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { title, summary, content },
        { new: true }
      );

      res.json(updatedPost);
    });
  } catch (error) {
    console.error('Error updating post', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



