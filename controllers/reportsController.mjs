import { client } from "../config/db.mjs";
import { ObjectId } from "mongodb";
import cloudinary from "../config/cloudinary.mjs";

const reportCollection = client.db("healthMateDB").collection("userReports");

// ---------------- Add Manual Report ----------------
export const addReport = async (req, res) => {
  try {
    const { title, notes } = req.body;
    const file = req.file;
    const userId = req.user.id;

    if (!title) return res.status(400).json({ error: "Title is required" });
    if (!file) return res.status(400).json({ error: "File is required" });

    let fileUrl = null;

    if (file) {
      const base64Data = file.buffer.toString("base64");
      const uploaded = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64Data}`,
        { folder: "healthmate", resource_type: "auto" }
      );
      fileUrl = uploaded.secure_url;
    }

    const report = {
      userId,
      title,
      notes: notes || "",
      fileUrl,
      type: "manual",
      createdAt: new Date(),
    };

    const result = await reportCollection.insertOne(report);

    res.json({
      success: true,
      message: "Report added successfully",
      data: { _id: result.insertedId, ...report },
    });
  } catch (err) {
    console.error("Add Report Error:", err);
    res.status(500).json({ error: "Failed to add report" });
  }
};

// ---------------- Get All Reports ----------------
export const getReports = async (req, res) => {
  try {
    const userId = req.user.id;

    const reports = await reportCollection
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    const aiReports = reports.filter(r => r.type === "ai");
    const manualReports = reports.filter(r => r.type === "manual");

    res.json({ success: true, aiReports, manualReports });
  } catch (err) {
    console.error("Get Reports Error:", err);
    res.status(500).json({ error: "Failed to get reports" });
  }
};

// ---------------- Edit Manual Report ----------------
export const editReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, notes, type } = req.body;
    const file = req.file;

    if (!id) return res.status(400).json({ error: "Report ID required" });

    if (type === "ai")
      return res.status(400).json({ error: "AI reports cannot be edited" });
    const updateData = {};
    if (title) updateData.title = title;
    if (notes) updateData.notes = notes;

    if (file) {
      const base64Data = file.buffer.toString("base64");
      const uploaded = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${base64Data}`,
        { folder: "healthmate", resource_type: "auto" }
      );
      updateData.fileUrl = uploaded.secure_url;
    }

    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ error: "At least one field required to update" });

    const result = await reportCollection.findOneAndUpdate(
      { _id: new ObjectId(id), userId: req.user.id, type: "manual" },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result.value)
      return res.status(404).json({ error: "Report not found" });

    res.json({
      success: true,
      message: "Report updated successfully",
      data: result.value,
    });
  } catch (err) {
    console.error("Edit Report Error:", err);
    res.status(500).json({ error: "Failed to edit report" });
  }
};

// ---------------- Delete Report ----------------
export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Report ID required" });

    const result = await reportCollection.deleteOne({
      _id: new ObjectId(id),
      userId: req.user.id,
    });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Report not found" });

    res.json({
      success: true,
      message: "Report deleted successfully",
      deletedId: id,
    });
  } catch (err) {
    console.error("Delete Report Error:", err);
    res.status(500).json({ error: "Failed to delete report" });
  }
};
