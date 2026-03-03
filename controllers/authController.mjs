import { successResponse, errorResponse } from "../utils/response.mjs";
import { client } from "../config/db.mjs";
import validator from "validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

const userCollection = client.db("healthMateDB").collection("users");

export const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    return res.status(400).json(errorResponse("Required parameter(s) missing"));
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json(errorResponse("Invalid email format"));
  }

  try {
    const existingUser = await userCollection.findOne({
      email: email,
    });

    if (existingUser) {
      return res.status(409).json(errorResponse("Email already registered"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userCollection.insertOne({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email,
      password: hashedPassword,
      createdOn: new Date(),
    });

    return res.status(201).json(successResponse("User created"));
  } catch (err) {
    console.error("signUp error:", err);
    return res.status(500).json(errorResponse("Server error"));
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json(errorResponse("Required parameter(s) missing"));
  }

  try {
    const existingUser = await userCollection.findOne({
      email: email,
    });

    if (!existingUser) {
      return res
        .status(404)
        .json(errorResponse("Email or password is incorrect"));
    }

    const passwordMatch = await bcrypt.compare(password, existingUser.password);

    if (!passwordMatch) {
      return res.status(401).json(errorResponse("Invalid credentials"));
    }

    const token = jwt.sign(
      {
        firstName:existingUser.firstName,
        lastName:existingUser.lastName,
        id: existingUser._id,
      },
      process.env.SECRET,
      { expiresIn: "30d" },
    );

    return res.status(200).json(
      successResponse("Login successful", {
        token,
      }),
    );
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json(errorResponse("Server error"));
  }
};

export const check = async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1]; // Expect "Bearer token"
    if (!token) {
      return res.status(401).json(errorResponse("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.SECRET);

    const result = await userCollection.findOne({
      _id: new ObjectId(decoded.id),
    });

    const response = {
      id: result._id,
      email: result.email,
      firstName: result.firstName,
      lastName: result.lastName,
    };

    return res
      .status(200)
      .json(successResponse("Authenticated", { user: response }));
  } catch (err) {
    console.error("check error:", err);
    return res.status(401).json(errorResponse("Invalid or expired token"));
  }
};
