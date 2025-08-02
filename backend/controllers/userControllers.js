import User from "../models/userModels.js";
import Conversation from "../models/conversationModels.js";

export const getUserBySearch = async (req, res) => {
  try {
    const search = req.query.search || "";
    const currentUserId = req.user._id;
    const user = await User.find({
      $and: [
        {
          $or: [
            { username: { $regex: ".*" + search + ".*", $options: "i" } },
            { fullname: { $regex: ".*" + search + ".*", $options: "i" } },
          ],
        },
        {
          _id: { $ne: currentUserId },
        },
      ],
    })
      .select("-password")
      .select("-email");

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error,
    });
    // console.log("error: ", error);
  }
};

export const getCurrentChatters = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const currentChatters = await Conversation.find({
      participants: currentUserId,
    }).sort({
      updatedAt: -1,
    });

    if (!currentChatters || currentChatters.length === 0)
      return res.status(200).send([]);

    const participantIDS = currentChatters.reduce((ids, conversation) => {
      const otherParticipants = conversation.participants.filter(
        (id) => id.toString() !== currentUserId.toString()
      );
      return [...ids, ...otherParticipants];
    }, []);

    const otherParticipantsIDS = participantIDS.filter(
      (id) => id.toString() !== currentUserId.toString()
    );

    const user = await User.find({ _id: { $in: otherParticipantsIDS } })
      .select("-password")
      .select("-email");

    const users = otherParticipantsIDS.map((id) =>
      user.find((user) => user._id.toString() === id.toString())
    );

    res.status(200).send(users);
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error,
    });
    //console.log("error: ", error);
  }
};

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password -privateKey"); // exclude sensitive fields

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("getUserById error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
