import { Request, Response } from "express";

import { jobQueue } from "../../queues/job.queue";
import { notificationQueue } from "../../jobs/queues/notification.queue";

// ==========================================
// TEST JOB
// ==========================================

export const testJob = async (
  req: Request,
  res: Response
) => {
  try {
    const { message } = req.body;

    const job = await jobQueue.add(
      "test-job",
      {
        message:
          message || "Test background job",
      }
    );

    if (!job) {
      throw new Error(
        "Failed to create test job"
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Job added to queue successfully",
      jobId: job.id,
    });
  } catch (error) {
    console.error(
      "Test job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add job",
    });
  }
};

// ==========================================
// TEST NOTIFICATION JOB
// ==========================================

export const testNotificationJob = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      userId,
      organizationId,
      title,
      message,
      type,
      entityType,
      entityId,
      priority,
    } = req.body;

    // ======================================
    // VALIDATION
    // ======================================

    if (
      !userId ||
      !organizationId ||
      !title ||
      !message
    ) {
      return res.status(400).json({
        success: false,
        message:
          "userId, organizationId, title and message are required",
      });
    }

    // ======================================
    // ADD NOTIFICATION JOB
    // ======================================

    const job =
      await notificationQueue.add(
        "notification-created",
        {
          userId,
          organizationId,
          title,
          message,
          type:
            type || "System",
          entityType,
          entityId,
          priority:
            priority || "Medium",
        }
      );

    if (!job) {
      throw new Error(
        "Failed to create notification job"
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Notification job added successfully",
      jobId: job.id,
    });
  } catch (error) {
    console.error(
      "Notification job error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to add notification job",
    });
  }
};