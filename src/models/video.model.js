
import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: [true, "Video file URL is required"],
      trim: true,
      unique: true,
    },

    thumbnail: {
      type: String,
      required: [true, "Thumbnail URL is required"],
      trim: true,
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Video owner is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
      minlength: [3, "Title must contain at least 3 characters"],
      maxlength: [100, "Title cannot exceed 100 characters"],
      index: true,
    },

    description: {
      type: String,
      required: [true, "Video description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    duration: {
      type: Number,
      required: [true, "Video duration is required"],
      min: [0, "Duration cannot be negative"],
      validate: {
        validator: Number.isFinite,
        message: "Duration must be a finite number",
      },
    },

    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Views must be a whole number",
      },
    },

    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.plugin(mongooseAggregatePaginate)
 
export const Video = mongoose.model("Video", videoSchema);
