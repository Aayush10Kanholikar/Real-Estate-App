import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    //Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    //create a new user and save to db
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    console.log(newUser);
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to create User" });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    //check if the user exists
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: "Invaid Credentials!!" });
    }
    //check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invaid Credentials!!" });
    }

    //generate a cookie token and send to the user

    // res.setHeader("Set-Cookie", "test=" + "myValue").json("success");
    const age = 1000 * 60 * 60 * 24 * 7;

    const token = jwt.sign(
      {
        id: user.id,
        // isAdmin: false,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: age }
    );

    const { password: userPassword, ...userInfo } = user;

    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: age,
      })
      .status(200)
      .json(userInfo);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to login" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};
