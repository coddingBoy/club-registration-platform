const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    ageGroup: {
      type: String,
      required: true,
      enum: ["U6", "U8", "U10", "U12", "U14", "U16"],
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    medicalNotes: {
      type: String,
      trim: true,
      default: "",
    },
    paymentReference: {
      type: String,
      trim: true,
      default: "",
    },
    paymentProofUrl: {
      type: String,
      default: "",
    },
    paymentProofName: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "waitlisted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

registrationSchema.index({
  playerName: "text",
  parentName: "text",
  email: "text",
  phone: "text",
});

module.exports = mongoose.model("Registration", registrationSchema);
