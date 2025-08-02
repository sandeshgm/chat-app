import jwt from "jsonwebtoken";

export const jwtToken = async (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "30 days",
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 10);
  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    expire: expiresAt,
    sameSite: "strict",
    secure: true,
  });
};
