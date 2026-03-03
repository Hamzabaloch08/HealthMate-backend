import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response.mjs";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.SECRET);

      // Attach user info to request
      req.user = decoded;
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      return res.status(401).json(errorResponse("Not authorized, token failed"));
    }
  }

  if (!token) {
    res.status(401);
    return res.status(401).json(errorResponse("Not authorized, no token"));
  }
};
