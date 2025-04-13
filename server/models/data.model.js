import mongoose from "mongoose";

const dataSchema = new mongoose.Schema(
  {},
  {
    strict: false,
    timestamps: true,
    versionKey: false,
  }
);

dataSchema.index({ createdAt: 1 });

export const DataModel = mongoose.model("Data", dataSchema);
