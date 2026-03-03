import { client } from "../config/db.mjs";
import { ObjectId } from "mongodb";

const taskCollection = client.db("healthMateDB").collection("userHealth");

// ---------------- Add Vitals ----------------
export const addVitals = async (req, res) => {
  try {
    const { bp, sugar, weight, heartRate, temperature, height, bmi, cholesterol } = req.body;
    const id = req.user.id;

    if (!bp && !sugar && !weight && !heartRate && !temperature && !height && !bmi && !cholesterol)
      return res.status(400).json({ error: "At least one vital is required" });

    let vital = {}
    if(bp)vital.bp = bp
    if(sugar)vital.sugar = sugar
    if(weight)vital.weight = weight
    if(heartRate)vital.heartRate = heartRate
    if(temperature)vital.temperature = temperature
    if(height)vital.height = height
    if(bmi)vital.bmi = bmi
    if(cholesterol)vital.cholesterol = cholesterol

    const vitalsEntry = {
      userId: id,
      ...vital,
      createdAt: new Date(),
    };

    const result = await taskCollection.insertOne(vitalsEntry);

    res.json({
      success: true,
      message: "Vitals added successfully",
      data: { _id: result.insertedId, ...vitalsEntry },
    });
  } catch (err) {
    console.error("Add Vitals Error:", err);
    res.status(500).json({ error: "Failed to add vitals" });
  }
};

// ---------------- Get Vitals ----------------
export const getVitals = async (req, res) => {
  const id = req.user.id;
  try {
    const vitals = await taskCollection
      .find({ userId: id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, vitals });
  } catch (err) {
    console.error("Get Vitals Error:", err);
    res.status(500).json({ error: "Failed to get vitals" });
  }
};

// ---------------- Edit Vitals ----------------
export const editVitals = async (req, res) => {
  try {
    const { id } = req.params;
    const { bp, sugar, weight, heartRate, temperature, height, bmi, cholesterol } = req.body;

    if (!id) return res.status(400).json({ error: "Vitals ID required" });

    const updateData = {};
    if (bp) updateData.bp = bp;
    if (sugar) updateData.sugar = sugar;
    if (weight) updateData.weight = weight;
    if (heartRate) updateData.heartRate = heartRate;
    if (temperature) updateData.temperature = temperature;
    if (height) updateData.height = height;
    if (bmi) updateData.bmi = bmi;
    if (cholesterol) updateData.cholesterol = cholesterol;

    if (Object.keys(updateData).length === 0)
      return res
        .status(400)
        .json({ error: "At least one field required to update" });

    const result = await taskCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result.value)
      return res
        .status(404)
        .json({ error: "Vitals not found or no change made" });

    res.json({
      success: true,
      message: "Vitals updated successfully",
      data: result.value,
    });
  } catch (err) {
    console.error("Edit Vitals Error:", err);
    res.status(500).json({ error: "Failed to edit vitals" });
  }
};

// ---------------- Delete Vitals ----------------
export const deleteVitals = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Vitals ID required" });

    const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Vitals not found" });

    res.json({
      success: true,
      message: "Vitals deleted successfully",
      deletedId: id,
    });
  } catch (err) {
    console.error("Delete Vitals Error:", err);
    res.status(500).json({ error: "Failed to delete vitals" });
  }
};
