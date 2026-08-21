import mongoose from "mongoose";

import Notification from "./notification.model";

import {
  NotificationType,
  NotificationPriority,
} from "./notification.types";

// ==========================================
// TYPES
// ==========================================

interface CreateNotificationData {
  notificationId?: string;

  recipient: string;

  organizationId: string;

  type: NotificationType;

  title: string;

  message: string;

  priority?: NotificationPriority;

  relatedEntity?: {
    entityType:
      | "Incident"
      | "Problem"
      | "ServiceRequest"
      | "Change"
      | "RCA"
      | "SLA";

    entityId: string;
  };
}

// ==========================================
// OBJECT ID VALIDATION
// ==========================================

const validateObjectId = (
  id: string,
  fieldName: string
): mongoose.Types.ObjectId => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return new mongoose.Types.ObjectId(id);
};

// ==========================================
// GENERATE NOTIFICATION ID
// ==========================================

const generateNotificationId = (): string => {
  return `NOT-${Date.now()}-${Math.floor(
    Math.random() * 1000
  )}`;
};

// ==========================================
// CREATE NOTIFICATION
// ==========================================

export const createNotification = async (
  data: CreateNotificationData
) => {
  const recipient = validateObjectId(
    data.recipient,
    "recipient ID"
  );

  const organizationId = validateObjectId(
    data.organizationId,
    "organization ID"
  );

  let relatedEntity;

  if (data.relatedEntity) {
    const entityId = validateObjectId(
      data.relatedEntity.entityId,
      "related entity ID"
    );

    relatedEntity = {
      entityType: data.relatedEntity.entityType,
      entityId,
    };
  }

  const notification = await Notification.create({
    notificationId:
      data.notificationId ||
      generateNotificationId(),

    recipient,

    organizationId,

    type: data.type,

    title: data.title,

    message: data.message,

    priority:
      data.priority || "Medium",

    status: "Unread",

    relatedEntity,
  });

  return notification;
};

// ==========================================
// GET USER NOTIFICATIONS
// ==========================================

export const getUserNotifications = async (
  userId: string,
  organizationId: string
) => {
  const recipient = validateObjectId(
    userId,
    "user ID"
  );

  const orgId = validateObjectId(
    organizationId,
    "organization ID"
  );

  return Notification.find({
    recipient,
    organizationId: orgId,
  })
    .populate(
      "recipient",
      "name email role"
    )
    .sort({
      createdAt: -1,
    });
};

// ==========================================
// GET NOTIFICATION BY ID
// ==========================================

export const getNotificationById = async (
  notificationId: string,
  userId: string,
  organizationId: string
) => {
  const notificationObjectId =
    validateObjectId(
      notificationId,
      "notification ID"
    );

  const userObjectId = validateObjectId(
    userId,
    "user ID"
  );

  const orgObjectId = validateObjectId(
    organizationId,
    "organization ID"
  );

  const notification =
    await Notification.findOne({
      _id: notificationObjectId,
      recipient: userObjectId,
      organizationId: orgObjectId,
    }).populate(
      "recipient",
      "name email role"
    );

  if (!notification) {
    throw new Error(
      "Notification not found"
    );
  }

  return notification;
};

// ==========================================
// GET UNREAD COUNT
// ==========================================

export const getUnreadNotificationCount =
  async (
    userId: string,
    organizationId: string
  ) => {
    const recipient = validateObjectId(
      userId,
      "user ID"
    );

    const orgId = validateObjectId(
      organizationId,
      "organization ID"
    );

    const count =
      await Notification.countDocuments({
        recipient,
        organizationId: orgId,
        status: "Unread",
      });

    return count;
  };

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================

export const markNotificationAsRead =
  async (
    notificationId: string,
    userId: string,
    organizationId: string
  ) => {
    const notificationObjectId =
      validateObjectId(
        notificationId,
        "notification ID"
      );

    const recipient = validateObjectId(
      userId,
      "user ID"
    );

    const orgId = validateObjectId(
      organizationId,
      "organization ID"
    );

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationObjectId,
          recipient,
          organizationId: orgId,
        },
        {
          $set: {
            status: "Read",
            readAt: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

    if (!notification) {
      throw new Error(
        "Notification not found"
      );
    }

    return notification;
  };

// ==========================================
// MARK ALL NOTIFICATIONS AS READ
// ==========================================

export const markAllNotificationsAsRead =
  async (
    userId: string,
    organizationId: string
  ) => {
    const recipient = validateObjectId(
      userId,
      "user ID"
    );

    const orgId = validateObjectId(
      organizationId,
      "organization ID"
    );

    const result =
      await Notification.updateMany(
        {
          recipient,
          organizationId: orgId,
          status: "Unread",
        },
        {
          $set: {
            status: "Read",
            readAt: new Date(),
          },
        }
      );

    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    };
  };

// ==========================================
// DELETE NOTIFICATION
// ==========================================

export const deleteNotification = async (
  notificationId: string,
  userId: string,
  organizationId: string
) => {
  const notificationObjectId =
    validateObjectId(
      notificationId,
      "notification ID"
    );

  const recipient = validateObjectId(
    userId,
    "user ID"
  );

  const orgId = validateObjectId(
    organizationId,
    "organization ID"
  );

  const notification =
    await Notification.findOneAndDelete({
      _id: notificationObjectId,
      recipient,
      organizationId: orgId,
    });

  if (!notification) {
    throw new Error(
      "Notification not found"
    );
  }

  return notification;
};