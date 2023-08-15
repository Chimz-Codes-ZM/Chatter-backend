const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const PostSchema = new Schema(
  {
    title: String,
    summary: String,
    content: String,
    cover: String,
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  },
  {
    views: {
      type: Number,
      default: 0,
    },
  }
);

PostSchema.statics.updatePost = async function (postID, newData) {
  try {
    const updatedPost = await this.findByIdAndUpdate(postID, newData, {
      new: true,
    });
    return updatedPost;
  } catch (error) {
    throw error;
  }
};

const PostModel = model("Post", PostSchema);
module.exports = PostModel;
