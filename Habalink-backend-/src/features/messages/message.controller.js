import Message from "./message.model.js";
import mongoose from "mongoose";

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, propertyId, content } = req.body;

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      propertyId,
      content,
    });

    res.status(201).json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get conversation between user and receiver for a property
// @route   GET /api/messages/:receiverId/:propertyId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const { receiverId, propertyId } = req.params;
    const senderId = req.user._id;

    const messages = await Message.find({
      propertyId,
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    }).sort("createdAt");

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all conversations (inbox) for the current user
// @route   GET /api/messages/inbox
// @access  Private
export const getInbox = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            otherUser: {
              $cond: [
                { $eq: ["$senderId", userId] },
                "$receiverId",
                "$senderId",
              ],
            },
            propertyId: "$propertyId",
          },
          lastMessage: { $first: "$content" },
          lastMessageAt: { $first: "$createdAt" },
          lastSenderId: { $first: "$senderId" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiverId", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.otherUser",
          foreignField: "_id",
          as: "otherUser",
        },
      },
      { $unwind: "$otherUser" },
      {
        $lookup: {
          from: "properties",
          localField: "_id.propertyId",
          foreignField: "_id",
          as: "property",
        },
      },
      {
        $unwind: {
          path: "$property",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          otherUserId: "$_id.otherUser",
          propertyId: "$_id.propertyId",
          otherUserName: "$otherUser.fullName",
          otherUserEmail: "$otherUser.email",
          propertyTitle: "$property.title",
          lastMessage: 1,
          lastMessageAt: 1,
          lastSenderId: 1,
          unreadCount: 1,
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ]);

    res.status(200).json({ success: true, data: conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
